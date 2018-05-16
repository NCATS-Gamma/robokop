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

from setup import app, mail
from answer import get_answerset_by_id, Answerset
from question import get_question_by_id, list_questions_by_hash
from logging_config import logger

# set up Celery
app.config['broker_url'] = os.environ["CELERY_BROKER_URL"]
app.config['result_backend'] = os.environ["CELERY_RESULT_BACKEND"]
celery = Celery(app.name, broker=app.config['broker_url'])
celery.conf.update(app.config)
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

@celery.task(bind=True, queue='manager_initialize')
def initialize_question(self, question_hash, question_id=None, user_email=None):
    '''
    Initialize a new question:
    Answer.
    If answers do not exist:
        update and
        answer.
    '''

    logger.info("Initializing your question...")

    question_id = question_id if question_id else list_questions_by_hash(question_hash)[0].id
    question = get_question_by_id(question_id)

    self.update_state(state='ANSWERING, PRE-REFRESH')
    answerset_id = answer_question.apply_async(args=[question.hash]).get(disable_sync_subtasks=False) # don't send email here
    answerset = get_answerset_by_id(answerset_id) if answerset_id else None

    if answerset and answerset.answers:
        if user_email:
            try:
                with app.app_context():
                    question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}'
                    answerset_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}/a/{answerset_id}'
                    lines = [f'We have finished initializing your question: <a href="{question_url}">"{question.natural_question}"</a>.']
                    lines.append(f'<a href="{answerset_url}">ANSWERS</a>')
                    lines.append('Answers were found without refreshing the knowledge graph. You may be able to get more answers by refreshing the knowledge graph and answering again.')
                    html = '<br />\n'.join(lines)
                    msg = Message("ROBOKOP: Answers Ready",
                                sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                                recipients=['patrick@covar.com'], #[user_email],
                                html=html)
                    mail.send(msg)
            except Exception as err:
                raise RuntimeError(f"Failed to send 'completed initialization' email: {err}")
        return

    logger.info("Empty anwerset. Refreshing KG...")

    self.update_state(state='REFRESHING KG')
    result = update_kg.apply_async(args=[question.hash]).get(disable_sync_subtasks=False) # don't send email here

    self.update_state(state='ANSWERING')
    answerset_id = answer_question.apply_async(args=[question.hash]).get(disable_sync_subtasks=False) # don't send email here

    if user_email:
        try:
            with app.app_context():
                question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}'
                answerset_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}/a/{answerset_id}'
                lines = [f'We have finished initializing your question: <a href="{question_url}">"{question.natural_question}"</a>.']
                lines.append(f'<a href="{answerset_url}">ANSWERS</a>')
                html = '<br />\n'.join(lines)
                msg = Message("ROBOKOP: Answers Ready",
                            sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                            recipients=['patrick@covar.com'], #[user_email],
                            html=html)
                mail.send(msg)
        except Exception as err:
            raise RuntimeError(f"Failed to send 'completed initialization' email: {err}")

    logger.info("Done initializing.")

@celery.task(bind=True, queue='manager_answer')
def answer_question(self, question_hash, question_id=None, user_email=None):
    '''
    Generate answerset for a question
    '''

    self.update_state(state='ANSWERING')
    logger.info("Answering your question...")

    question_id = question_id if question_id else list_questions_by_hash(question_hash)[0].id
    question = get_question_by_id(question_id)

    r = requests.post(f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/', json=question.toJSON())
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
    answerset = Answerset(answerset_json, question_hash=question_hash)

    if user_email:
        try:
            with app.app_context():
                question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}'
                answerset_url = f'http://{os.environ["ROBOKOP_HOST"]}/a/{answerset.id}'
                lines = [f'We have finished answering your question: <a href="{question_url}">"{question.natural_question}"</a>.']
                lines.append(f'<a href="{answerset_url}">ANSWERS</a>')
                html = '<br />\n'.join(lines)
                msg = Message("ROBOKOP: Answers Ready",
                            sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                            recipients=['patrick@covar.com'], #[user_email],
                            html=html)
                mail.send(msg)
        except Exception as err:
            logger.error(f"Failed to send 'completed answer' email: {err}")

    logger.info("Done answering.")
    return answerset.id

@celery.task(bind=True, queue='manager_update')
def update_kg(self, question_hash, question_id=None, user_email=None):
    '''
    Update the shared knowledge graph with respect to a question
    '''

    self.update_state(state='UPDATING KG')

    question_id = question_id if question_id else list_questions_by_hash(question_hash)[0].id
    question = get_question_by_id(question_id)

    logger.info(f"Updating the knowledge graph for '{question.name}'...")

    try:
        r = requests.post(f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/', json=question.toJSON())
        polling_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{r.json()['task id']}"
        
        for i in range(60*60*24): # wait up to 1 day
            r = requests.get(polling_url, auth=(os.environ['FLOWER_USER'], os.environ['FLOWER_PASSWORD']))
            if r.json()['state'] == 'SUCCESS':
                break
            time.sleep(1)
        else:
            raise RuntimeError("KG updating has not completed after 1 day. It will continue working, but we must return to the manager.")


    except Exception as err:
        logger.exception("Something went wrong with updating KG.")
        raise err

    try:
        if user_email:
            # send completion email
            question_url = f'http://{os.environ["ROBOKOP_HOST"]}/q/{question.id}'
            lines = [f'We have finished gathering information for your question: <a href="{question_url}">"{question.natural_question}"</a>.']
            html = '<br />\n'.join(lines)
            with app.app_context():
                msg = Message("ROBOKOP: Knowledge Graph Update Complete",
                            sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                            recipients=['patrick@covar.com'], #[user_email],
                            html=html)
                mail.send(msg)
    except Exception as err:
        logger.error(f"Failed to send 'completed KG update' email: {err}")

    logger.info(f"Done updating for '{question.name}'.")
    return "You updated the KG!"
