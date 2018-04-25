'''
Tasks for Celery workers
'''

import time
import os
import sys
from celery import Celery
from kombu import Queue
from flask_mail import Message
from flask_security.core import current_user

from setup import app, mail, rosetta
from answer import get_answerset_by_id
from question import get_question_by_id, list_questions_by_hash
from logging_config import logger

greent_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-interfaces')
sys.path.insert(0, greent_path)
from greent import node_types
from greent.rosetta import Rosetta
from greent.graph_components import KNode

sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-build', 'builder'))
from userquery import UserQuery
from builder import KnowledgeGraph, lookup_identifier, tokenize_path, run_query, generate_query

# set up Celery
app.config['broker_url'] = os.environ["CELERY_BROKER_URL"]
app.config['result_backend'] = os.environ["CELERY_RESULT_BACKEND"]
celery = Celery(app.name, broker=app.config['broker_url'])
celery.conf.update(app.config)
celery.conf.task_queues = (
    Queue('answer', routing_key='answer'),
    Queue('update', routing_key='update'),
    Queue('initialize', routing_key='initialize'),
)

@celery.task(bind=True, queue='initialize')
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
        return

    logger.info("Empty anwerset. Refreshing KG...")

    self.update_state(state='REFRESHING KG')
    result = update_kg.apply_async(args=[question.hash]).get(disable_sync_subtasks=False) # don't send email here

    self.update_state(state='ANSWERING')
    answerset_id = answer_question.apply_async(args=[question.hash]).get(disable_sync_subtasks=False) # don't send email here

    if user_email:
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

    logger.info("Done initializing.")

@celery.task(bind=True, queue='answer')
def answer_question(self, question_hash, question_id=None, user_email=None):
    '''
    Generate answerset for a question
    '''

    self.update_state(state='ANSWERING')
    logger.info("Answering your question...")

    question_id = question_id if question_id else list_questions_by_hash(question_hash)[0].id
    question = get_question_by_id(question_id)

    try:
        answerset = question.answer()
        if answerset.answers:
            self.update_state(state='ANSWERS FOUND')
            logger.info("Answers found.")
        else:
            self.update_state(state='NO ANSWERS FOUND')
            logger.info("No answers found.")
    except Exception as err:
        logger.error("Something went wrong with question answering.")
        raise err

    if user_email:
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

    logger.info("Done answering.")
    return answerset.id

@celery.task(bind=True, queue='update')
def update_kg(self, question_hash, question_id=None, user_email=None):
    '''
    Update the shared knowledge graph with respect to a question
    '''

    self.update_state(state='UPDATING KG')
    logger.info("Updating the knowledge graph...")
    self.send_event('task_progress', {'hello':'world'})

    question_id = question_id if question_id else list_questions_by_hash(question_hash)[0].id
    question = get_question_by_id(question_id)

    try:
        symbol_lookup = {node_types.type_codes[a]:a for a in node_types.type_codes} # invert this dict
        # assume the nodes are in order
        node_string = ''.join([symbol_lookup[n['type']] for n in question.nodes])
        start_identifiers = question.nodes[0]['identifiers']
        end_identifiers = question.nodes[-1]['identifiers']

        steps = tokenize_path(node_string)
        query = generate_query(steps, start_identifiers, end_identifiers)
        run_query(query, supports=['chemotext'], result_name='q_'+question.hash, rosetta=rosetta, prune=False)

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

        logger.info("Done updating.")
        return "You updated the KG!"

    except Exception as err:
        logger.exception("Something went wrong with updating KG.")
        raise err
