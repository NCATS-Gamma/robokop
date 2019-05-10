"""Tasks for Celery workers."""

import os
import json
import time
import logging
import redis

import requests
from celery import Celery, signals
from kombu import Queue, Exchange
from flask_mail import Message

from manager.setup import app, mail
from manager.task import TASK_TYPES, save_task_info, save_task_result, save_starting_task_info, save_remote_task_info, save_final_task_info  # make sure that question knows about .tasks
from manager.tables_accessors import add_answerset, get_question_by_id, get_qgraph_id_by_question_id
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
    Queue('manager_pubmed', exchange=task_exchange, routing_key='manager.pubmed'),
)

@signals.after_task_publish.connect()
def initialize_task(**kwargs):
    headers = kwargs.get('headers')
    
    # Save initial task information into POSTGRES
    task_id = headers['id']

    task_fun = headers['task']
    if task_fun == 'manager.tasks.fetch_pubmed_info':
        return

    # logger.debug(f'task headers {headers}')

    if task_fun == 'manager.tasks.answer_question':
        task_type = TASK_TYPES['answer']
    elif task_fun == 'manager.tasks.update_kg':
        task_type = TASK_TYPES['update']
    else:
        task_type = 'UNKNOWN'
    task_args = json.loads(headers['kwargsrepr'].replace("'",'"'))
    
    initiator = task_args['user_email']
    
    question_id_list = json.loads(headers['argsrepr'].replace("'",'"'))
    question_id = question_id_list[0]
    
    save_task_info(
        task_id=task_id,
        question_id=question_id,
        task_type=task_type,
        initiator=initiator,
    )

@signals.task_prerun.connect()
def setup_logging(signal=None, sender=None, task_id=None, task=None, *args, **kwargs):
    """Change the main logger's handlers so they could log to a task specific log file."""
    # logger.info('1')
    # headers = task['headers']
    # logger.info('2')
    # task_fun = headers['task']
    # logger.info('3')
    # if task_fun == 'manager.tasks.fetch_pubmed_info':
    #     logger.info('4')
    #     return
    # logger.info('5')

    logger = logging.getLogger('manager')
    logger.info(f'Starting task specific log for task {task_id}')
    clear_log_handlers(logger)
    add_task_id_based_handler(logger, task_id)
    logger.info(f'This is a task specific log for task {task_id}')


@signals.task_postrun.connect()
def task_post_run(**kwargs):
    """Reverts back logging to main configuration once task is finished.

    Updates task object with end time.
    """
    # task = kwargs.get('task')
    # headers = task['headers']
    # task_fun = headers['task']
    # if task_fun == 'manager.tasks.fetch_pubmed_info':
    #     return

    task_id = kwargs.get('task_id')
    
    # Sync task status
    save_task_result(task_id)

    # Switch the loggers around
    logger = logging.getLogger('manager')
    save_final_task_info(task_id)
    logger.info('Task is complete. Ending task specific log.')
    clear_log_handlers(logger)
    # change logging config back to the way it was
    set_up_main_logger()
    # finally log task has finished to main file
    logger = logging.getLogger(__name__)
    logger.info(f"Task {kwargs.get('task_id')} is complete")


class NoAnswersException(Exception):
    pass


@celery.task(bind=True, name='answer', exchange='manager', routing_key='manager.answer', task_acks_late=True, track_started=True, worker_prefetch_multiplier=1)
def answer_question(self, question_id, user_email=None):
    """Generate answerset for a question."""
    self.update_state(state='ANSWERING')
    logger.info("Answering question")
    
    save_starting_task_info(task_id=self.request.id)

    try:
        question = get_question_by_id(question_id)
        qgraph_id = get_qgraph_id_by_question_id(question_id)
        logger.info(f'question_graph: {question}')
        message = {
            'question_graph': question['question_graph'],
        }

        logger.info('Calling Ranker')
        try:
            response = requests.post(f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/?output_format=Answers', json=message)
        except Exception as err:
            logger.warning('Failed to contact the ranker')
            logger.exception(err)
            raise err

        remote_task_id = response.json()['task_id']

        logger.info(f'The ranker has acknowledged with task_id {remote_task_id}')
        save_remote_task_info(self.request.id, remote_task_id)
        
        logger.info(f"Starting to poll for results.")
        polling_url = f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/task/{remote_task_id}"
        for _ in range(60 * 60 * 24):  # wait up to 1 day
            time.sleep(1)
            response = requests.get(polling_url)
            if response.status_code == 200:
                # logger.info(f"Poll results: {response}")
                if response.json()['status'] == 'FAILURE':
                    logger.info('Ranker reported the task as FAILURE. Aborting.')
                    raise RuntimeError('Question answering failed.')
                if response.json()['status'] == 'REVOKED':
                    logger.info('Ranker reported the task as REVOKED. Aborting.')
                    raise RuntimeError('Task terminated by admin.')
                if response.json()['status'] == 'SUCCESS':
                    break
                if _ % 30 == 0: # Every 30s update the log?
                    logger.info(f'Ranker is reporting it is busy, status = {response.json()["status"]}')
                else:
                    pass
            else:
                # We didn't get a 200. This is because of server error or sometimes a dropped task
                raise RuntimeError('Ranker did not return a 200 when requesting task status.')
        else:
            # We couldn't complete the task in a day!? That's a problem.
            #
            # We should cancel the ranker task, otherwise it will run for a long while and no one will listen to the answer.
            # To delete the ranker task we send a delete request to the polling_url
            response = requests.delete(polling_url)
            # We could check the response here, but there is nothing really that the user can do
            raise RuntimeError("Question answering has not completed after 1 day. The task has been canceled")

        logger.info('Ranking reported as SUCCESS. Requesting answers:')
        response = requests.get(f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/task/{remote_task_id}/result')
        
        message = response.json()
        # logger.info(message)

        if not isinstance(message, dict) or not message["answers"]:
            logger.info(f'No answers found')
            try:
                if user_email:
                    logger.info('Sending email notification')
                    # send completion email
                    question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question["id"]}'
                    nat_quest = question["natural_question"]
                    lines = [f'We are sorry but we did not find any answers for your question: <a href="{question_url}">"{nat_quest}"</a>.']
                    html = '<br />\n'.join(lines)
                    with app.app_context():
                        msg = Message(
                            "ROBOKOP: Question Answering Found No Answers",
                            sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                            recipients=[user_email],
                            html=html)
                        mail.send(msg)
            except Exception as err:
                logger.warning(f"Failed to send 'no answers' email: {err}")
                
            return "NORESULTS"

        logger.info(f'{len(message["answers"])} answers were found')

        logger.info('Storing answers.')
        answerset_id = add_answerset(message['answers'], qgraph_id=qgraph_id)
        logger.info('Answers stored.')
        try:
            if user_email:
                logger.info('Sending email notification')
                # send completion email
                question_url = f'http://{os.environ["ROBOKOP_HOST"]}/a/{question["id"]}_{answerset_id}'
                nat_quest = question["natural_question"]
                lines = [f'We have finished answering your question: <a href="{question_url}">"{nat_quest}"</a>.']
                html = '<br />\n'.join(lines)
                with app.app_context():
                    msg = Message(
                        "ROBOKOP: Question Answering Complete",
                        sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                        recipients=[user_email],
                        html=html)
                    mail.send(msg)
        except Exception as err:
            logger.warning(f"Failed to send 'completed answer update' email: {err}")

    except Exception as err:
        logger.warning(f"Exception found during answering '{question_id}'.")
        try:
            logger.info(f"Saving final task info after error")
            save_final_task_info(task_id=self.request.id)
        except:
            pass
        logger.exception(err)
        raise err

    try:
        save_final_task_info(task_id=self.request.id)
    except:
        pass

    logger.info(f"Done answering '{question_id}'.")

    return answerset_id


@celery.task(bind=True, name='update', exchange='manager', routing_key='manager.update', task_acks_late=True, track_started=True, worker_prefetch_multiplier=1)
def update_kg(self, question_id, user_email=None):
    """Update the shared knowledge graph with respect to a question."""
    self.update_state(state='UPDATING KG')
    logger.info(f"Updating the knowledge graph for '{question_id}'")

    save_starting_task_info(task_id=self.request.id)

    try:
        question_json = get_question_by_id(question_id)
        builder_question = {'machine_question': question_json['question_graph']}

        logger.info('Calling Builder')
        try:
            response = requests.post(f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/', json=builder_question)
        except Exception as err:
            logger.warning('Failed to contact the builder')
            logger.exception(err)
            raise err

        remote_task_id = response.json()['task_id']

        logger.info(f'The builder has acknowledge with task_id {remote_task_id}')
        save_remote_task_info(self.request.id, remote_task_id)

        logger.info(f"Starting to poll for results.")
        polling_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{remote_task_id}"
        for _ in range(60 * 60 * 24):  # wait up to 1 day
            time.sleep(1)
            response = requests.get(polling_url)
            if response.status_code == 200:
                if response.json()['status'] == 'FAILURE':
                    logger.info('Builder reported the task as FAILURE. Aborting.')
                    raise RuntimeError('Knowledge graph building failed.')
                if response.json()['status'] == 'REVOKED':
                    logger.info('Builder reported the task as REVOKED. Aborting.')
                    raise RuntimeError('Task terminated by admin.')
                if response.json()['status'] == 'SUCCESS':
                    break
                if _ % 30 == 0: # Every 30s update the log?
                    logger.info(f'Builder is reporting it is busy, status = {response.json()["status"]}')
                else:
                    pass
            else:
                # We didn't get a 200. This is because of server error or sometimes a dropped task
                raise RuntimeError('Builder did not return a 200 when requesting task status.')
        else:
            raise RuntimeError("KG updating has not completed after 1 day. It will continue working, but we must return to the manager.")

        logger.info('Builder reported SUCCESS.')
        
        try:
            if user_email:
                # send completion email
                question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question_id}'
                nat_quest = question_json["natural_question"] if 'natural_question' in question_json else "Check it out"
                lines = [f'We have finished gathering information for your question: <a href="{question_url}">"{nat_quest}"</a>.']
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

    except Exception as err:
        try:
            logger.info(f"Saving final task info after error")
            save_final_task_info(task_id=self.request.id)
        except:
            pass
        logger.exception(err)
        raise err

    try:
        save_final_task_info(task_id=self.request.id)
    except:
        pass

    logger.info(f"Done updating '{question_id}'.")

    return "You updated the KG!"


@celery.task(bind=True, name='pubmed', exchange='manager', routing_key='manager.pubmed', task_acks_late=True, track_started=True, worker_prefetch_multiplier=1, rate_limit='1/s')
def fetch_pubmed_info(self, pmid, pubmed_cache_key):
    # Actually make the request
    postUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    postData = {"db": "pubmed", "id": pmid, "version": "2.0", "retmode": "json"}

    response = requests.post(postUrl, data=postData)

    # When you get the request back
    if not response.ok:
        # logger.debug(f'Pubmed returned a bad response for {pmid}, status code {response.status_code}')
        if response.status_code == 429:
            return 'Too many robokop pubmed requests'
        return f'Unable to complete pubmed request, pubmed request status {response.status_code}'

    pubmed_payload = response.json()
    if not pubmed_payload or 'result' not in pubmed_payload:
        # logger.debug(f'Pubmed returned a bad json response for {pmid}, response json {pubmed_payload}')
        return 'Unable to complete pubmed request, bad pubmed response'
    
    pubmed_result = pubmed_payload['result']
    if pmid not in pubmed_result:
        # logger.debug(f'Pubmed returned a bad json result for {pmid}, result {pubmed_result}')
        return 'Unable to complete pubmed request, bad pubmed result'

    pubmed_info = pubmed_result[pmid]

    pubmed_redis_client = redis.Redis(
        host=os.environ['PUBMED_CACHE_HOST'],
        port=os.environ['PUBMED_CACHE_PORT'],
        db=os.environ['PUBMED_CACHE_DB'],
        password=os.environ['PUBMED_CACHE_PASSWORD'])
    pubmed_redis_client.set(pubmed_cache_key, json.dumps(pubmed_info))
    # logger.debug(f'Pubmed response is now cached for pmid {pmid}')

    return 'cached'
