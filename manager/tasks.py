"""Tasks for Celery workers."""

import os
import time
import logging

import requests
from celery import Celery, signals
from kombu import Queue, Exchange
from flask_mail import Message

# import deploy.initialize_manager
from manager.setup import app, mail, session_scope
from manager.answer import Answerset
from manager.question import get_question_by_id
import manager.task  # make sure that question knows about .tasks
import manager.logging_config  # set up the logger

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


# Tell celery not to mess with logging at all
@signals.setup_logging.connect
def setup_celery_logging(**kwargs):
    pass
celery.log.setup()


class NoAnswersException(Exception):
    pass


@celery.task(bind=True, exchange='manager', routing_key='manager.answer')
def answer_question(self, question_id, user_email=None):
    """Generate answerset for a question."""
    self.update_state(state='ANSWERING')
    logger.info("Answering your question...")

    with session_scope() as session:
        question = get_question_by_id(question_id, session=session)

        response = requests.post(f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/', json=question.to_json())
        polling_url = f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/task/{response.json()['task_id']}"

        for _ in range(60 * 60 * 24):  # wait up to 1 day
            time.sleep(1)
            response = requests.get(polling_url)
            if response.json()['status'] == 'FAILURE':
                raise RuntimeError('Question answering failed.')
            if response.json()['status'] == 'REVOKED':
                raise RuntimeError('Task terminated by admin.')
            if response.json()['status'] == 'SUCCESS':
                break
        else:
            raise RuntimeError("Question answering has not completed after 1 day. It will continue working, but will not be monitored from here.")

        answerset_json = requests.get(f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/result/{response.json()['task_id']}")

        answerset = Answerset(answerset_json.json())
        session.add(answerset)  # this might be redundant given the following
        question.answersets.append(answerset)

        if user_email:
            try:
                with app.app_context():
                    question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}'
                    answerset_url = f'http://{os.environ["ROBOKOP_HOST"]}/a/{question_id}_{answerset.id}'
                    lines = [f'We have finished answering your question: <a href="{question_url}">"{question.natural_question}"</a>.']
                    lines.append(f'<a href="{answerset_url}">ANSWERS</a>')
                    html = '<br />\n'.join(lines)
                    msg = Message(
                        "ROBOKOP: Answers Ready",
                        sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                        recipients=[user_email],
                        html=html)
                    mail.send(msg)
            except Exception as err:
                logger.warning(f"Failed to send 'completed answer' email: {err}")

        logger.info("Done answering.")
        return answerset.id


@celery.task(bind=True, exchange='manager', routing_key='manager.update')
def update_kg(self, question_id, user_email=None):
    """Update the shared knowledge graph with respect to a question."""
    self.update_state(state='UPDATING KG')

    logger.info(f"Updating the knowledge graph for '{question_id}'...")

    with session_scope() as session:
        question = get_question_by_id(question_id, session=session)
        response = requests.post(f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/', json=question.to_json())
        polling_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{response.json()['task id']}"

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
