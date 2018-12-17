"""Tasks for Celery workers."""

import os
import time
import logging

import requests
from celery import Celery, signals
from kombu import Queue, Exchange
from flask_mail import Message

from manager.setup import app, mail
from manager.task import TASK_TYPES, save_task_info, update_task_info  # make sure that question knows about .tasks
from manager.graphql_accessors import get_question_json_by_id, add_answerset, get_question_by_id
from manager.logging_config import set_up_main_logger, clear_log_handlers, add_task_id_based_handler  # set up the logger

logger = logging.getLogger(__name__)

# set up Celery
celery = Celery(app.name)
celery.conf.update(
    broker_url=os.environ["CELERY_BROKER_URL"],
    result_backend=os.environ["CELERY_RESULT_BACKEND"],
    task_track_started=True,
)
task_exchange = Exchange('manager', type='topic')
celery.conf.task_queues = (
    Queue('manager_answer', exchange=task_exchange, routing_key='manager.answer'),
    Queue('manager_update', exchange=task_exchange, routing_key='manager.update'),
)


@signals.task_prerun.connect()
def setup_logging(signal=None, sender=None, task_id=None, task=None, *args, **kwargs):
    """Change the main logger's handlers so they could log to a task specific log file."""
    logger = logging.getLogger('manager')
    clear_log_handlers(logger)
    add_task_id_based_handler(logger, task_id)


@signals.task_postrun.connect()
def task_post_run(**kwargs):
    """Reverts back logging to main configuration once task is finished.

    Updates task object with end time.
    """
    task_id = kwargs.get('task_id')
    logger = logging.getLogger('manager')
    update_task_info(task_id)
    logger.info("Fetched and stored results")
    clear_log_handlers(logger)
    # change logging config back to the way it was
    set_up_main_logger()
    # finally log task has finished to main file
    logger = logging.getLogger(__name__)
    logger.info(f"task {kwargs.get('task_id')} finished ...")


class NoAnswersException(Exception):
    pass


@celery.task(bind=True, exchange='manager', routing_key='manager.answer', task_acks_late=True, track_started=True, worker_prefetch_multiplier=1)
def answer_question(self, question_id, user_email=None):
    """Generate answerset for a question."""
    self.update_state(state='ANSWERING')
    logger.info("Answering your question...")

    try:
        question = get_question_by_id(question_id)
        qgraph_id = question.qgraph_id
        question = question.dump()
        message = {
            'question_graph': question['question_graph'],
            'knowledge_graph': {
                'nodes': [],
                'edges': []
            },
            'knowledge_maps': []
        }

        response = requests.post(f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/ti', json=message)
        message = response.json()
        answerset = message['answers']

        return add_answerset(answerset, qgraph_id=qgraph_id)
    except Exception as e:
        logger.exception(e)
        raise e


@celery.task(bind=True, exchange='manager', routing_key='manager.update', task_acks_late=True, track_started=True, worker_prefetch_multiplier=1)
def update_kg(self, question_id, user_email=None):
    """Update the shared knowledge graph with respect to a question."""
    self.update_state(state='UPDATING KG')
    logger.info(f"Updating the knowledge graph for '{question_id}'...")

    question = get_question_json_by_id(question_id)
    response = requests.post(f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/', json=question.to_json())
    remote_task_id = response.json()['task id']
    polling_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{remote_task_id}"

    save_task_info(
        task_id=self.request.id,
        question_id=question_id,
        task_type=TASK_TYPES['update'],
        initiator=user_email,
        remote_task_id=remote_task_id
    )
    logger.info(f"Remote Update task started with id: {remote_task_id}")
    for _ in range(60 * 60 * 24):  # wait up to 1 day
        time.sleep(1)
        response = requests.get(polling_url)
        if response.json()['status'] == 'FAILURE':
            raise RuntimeError('Builder failed.')
        if response.json()['status'] == 'REVOKED':
            raise RuntimeError('Task terminated by admin.')
        if response.json()['status'] == 'SUCCESS':
            break
    else:
        raise RuntimeError("KG updating has not completed after 1 day. It will continue working, but we must return to the manager.")

    try:
        if user_email:
            # send completion email
            question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}'
            lines = [f'We have finished gathering information for your question: <a href="{question_url}">"{question.natural_question}"</a>.']
            html = '<br />\n'.join(lines)
            with app.app_context():
                msg = Message(
                    "ROBOKOP: Knowledge Graph Update Complete",
                    sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                    recipients=[user_email],
                    html=html)
                mail.send(msg)
    except Exception as err:
        logger.warning(f"Failed to send 'completed KG update' email: {err}")

    logger.info(f"Done updating for '{question.natural_question}'.")
    return "You updated the KG!"
