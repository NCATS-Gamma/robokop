'''
Tasks for Celery workers
'''

import os
import sys
import time
import json
import requests
from celery import Celery, signals
from kombu import Queue
from flask_mail import Message

from manager.setup import app, mail, db
from manager.answer import get_answerset_by_id, Answerset
from manager.question import get_question_by_id
from manager.logging_config import logger

# set up Celery
celery = Celery(app.name)
celery.conf.update(
    broker_url=os.environ["CELERY_BROKER_URL"],
    result_backend=os.environ["CELERY_RESULT_BACKEND"],
)
celery.conf.task_queues = (
    Queue('manager_answer', routing_key='manager_answer'),
    Queue('manager_update', routing_key='manager_update'),
    Queue('manager_initialize', routing_key='manager_initialize'),
)
# Tell celery not to mess with logging at all
@signals.setup_logging.connect
def setup_celery_logging(**kwargs):
    pass
celery.log.setup()

class NoAnswersException(Exception):
    pass

@celery.task(bind=True, queue='manager_answer')
def answer_question(self, question_id, user_email=None):
    '''
    Generate answerset for a question
    '''

    self.update_state(state='ANSWERING')
    logger.info("Answering your question...")

    question = get_question_by_id(question_id)

    r = requests.post(f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/', json=question.to_json())
    # wait here for response
    if r.status_code == 204:
        # found 0 answers
        raise NoAnswersException("Question answering complete, found 0 answers.")
    self.update_state(state='ANSWERS FOUND')
    logger.info("Answers found.")
    try:
        answerset_json = r.json()
    except json.decoder.JSONDecodeError as err:
        raise ValueError(f"Response is not json: {r.text}")

    answerset = Answerset(answerset_json)
    question.answersets.append(answerset)
    db.session.commit()

    if user_email:
        try:
            with app.app_context():
                question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}'
                answerset_url = f'http://{os.environ["ROBOKOP_HOST"]}/a/{question_id}_{answerset.id}'
                lines = [f'We have finished answering your question: <a href="{question_url}">"{question.natural_question}"</a>.']
                lines.append(f'<a href="{answerset_url}">ANSWERS</a>')
                html = '<br />\n'.join(lines)
                msg = Message("ROBOKOP: Answers Ready",
                            sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                            recipients=[user_email],
                            html=html)
                mail.send(msg)
        except Exception as err:
            logger.warning(f"Failed to send 'completed answer' email: {err}")

    logger.info("Done answering.")
    return answerset.id

@celery.task(bind=True, queue='manager_update')
def update_kg(self, question_id, user_email=None):
    '''
    Update the shared knowledge graph with respect to a question
    '''

    self.update_state(state='UPDATING KG')

    question = get_question_by_id(question_id)

    logger.info(f"Updating the knowledge graph for '{question.name}'...")
    
    r = requests.post(f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/', json=question.to_json())
    polling_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{r.json()['task id']}"
        
    for _ in range(60*60*24): # wait up to 1 day
        r = requests.get(polling_url)
        if r.json()['state'] == 'FAILURE':
            raise RuntimeError('Builder failed.')
        if r.json()['state'] == 'REVOKED':
            raise RuntimeError('Task terminated by admin.')
        if r.json()['state'] == 'SUCCESS':
            break
        time.sleep(1)
    else:
        raise RuntimeError("KG updating has not completed after 1 day. It will continue working, but we must return to the manager.")

    try:
        if user_email:
            # send completion email
            question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}'
            lines = [f'We have finished gathering information for your question: <a href="{question_url}">"{question.natural_question}"</a>.']
            html = '<br />\n'.join(lines)
            with app.app_context():
                msg = Message("ROBOKOP: Knowledge Graph Update Complete",
                            sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                            recipients=[user_email],
                            html=html)
                mail.send(msg)
    except Exception as err:
        logger.warning(f"Failed to send 'completed KG update' email: {err}")

    logger.info(f"Done updating for '{question.name}'.")
    return "You updated the KG!"
