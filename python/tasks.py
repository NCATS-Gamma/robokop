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
from setup import app, mail
from question import get_question_by_id, list_questions_by_hash
from logging_config import logger

greent_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-interfaces')
sys.path.insert(0, greent_path)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-build','builder'))
from userquery import UserQuery
from greent import node_types
from greent.rosetta import Rosetta
from builder import KnowledgeGraph, generate_name_node, lookup_identifier, run as run_builder

# set up Celery
app.config['broker_url'] = os.environ["CELERY_BROKER_URL"]
app.config['result_backend'] = os.environ["CELERY_RESULT_BACKEND"]
celery = Celery(app.name, broker=app.config['broker_url'])
celery.conf.update(app.config)
celery.conf.task_queues = (
    Queue('answer', routing_key='answer'),
    Queue('update', routing_key='update'),
)

@celery.task(bind=True, queue='answer')
def answer_question(self, question_hash, user_email=None):
    '''
    Generate answerset for a question
    '''

    self.update_state(state='ANSWERING')
    logger.info("Answering your question...")

    question = list_questions_by_hash(question_hash)[0]
    answerset = question.answer()

    if user_email:
        with app.app_context():
            question_url = 'http://{}/q/{}'.format(os.environ['ROBOKOP_HOST'], question.id)
            answerset_url = 'http://{}/a/{}'.format(os.environ['ROBOKOP_HOST'], answerset.id)
            lines = ['We have finished answering your question: <a href="{1}">"{0}"</a>.'.format(
                question.natural_question,
                question_url)]
            lines.append('<a href="{}">ANSWERS</a>'.format(answerset_url))
            html = '<br />\n'.join(lines)
            msg = Message("ROBOKOP: Answers Ready",
                          sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                          recipients=['patrick@covar.com'], #[user_email],
                          html=html)
            mail.send(msg)

    logger.info("Done answering.")

@celery.task(bind=True, queue='update')
def update_kg(self, question_hash, user_email=None):
    '''
    Update the shared knowledge graph with respect to a question
    '''

    self.update_state(state='UPDATING KG')
    logger.info("Updating the knowledge graph...")

    question = list_questions_by_hash(question_hash)[0]

    # initialize rosetta
    rosetta = Rosetta()

    try:
        symbol_lookup = {node_types.type_codes[a]:a for a in node_types.type_codes} # invert this dict
        # assume the nodes are in order
        node_string = ''.join([symbol_lookup[n['type']] for n in question.nodes])
        start_name = question.nodes[0]['label'] if question.nodes[0]['nodeSpecType'] == 'Named Node' else None
        end_name = question.nodes[-1]['label'] if question.nodes[-1]['nodeSpecType'] == 'Named Node' else None
        run_builder(node_string, start_name, end_name, 'q_'+question.hash, ['chemotext'], os.path.join(greent_path, 'greent', 'greent.conf'))

        if user_email:
            # send completion email
            question_url = 'http://{}/q/{}'.format(os.environ['ROBOKOP_HOST'], question.id)
            lines = ['We have finished gathering information for your question: <a href="{1}">"{0}"</a>.'.format(
                question.natural_question,
                question_url)]
            html = '<br />\n'.join(lines)
            with app.app_context():
                msg = Message("ROBOKOP: Knowledge Graph Update Complete",
                              sender=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                              recipients=['patrick@covar.com'], #[user_email],
                              html=html)
                mail.send(msg)

        logger.info("Done updating.")

    except:
        logger.exception("Exception while updating KG.")
