'''
Tasks for Celery workers
'''

import os
import sys
from celery import Celery
from kombu import Queue

from setup import app
from logging_config import logger

sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-build', 'builder'))
from builder import tokenize_path, run_query, generate_query

# set up Celery
app.config['broker_url'] = os.environ["CELERY_BROKER_URL"]
app.config['result_backend'] = os.environ["CELERY_RESULT_BACKEND"]
celery = Celery(app.name, broker=app.config['broker_url'])
celery.conf.update(app.config)
celery.conf.task_queues = (
    Queue('answer', routing_key='answer'),
)

@celery.task(bind=True, queue='answer')
def answer_question(self, question):
    '''
    Generate answerset for a question
    '''

    self.update_state(state='ANSWERING')
    logger.info("Answering your question...")

    try:
        answerset = question.answer()
    except Exception as err:
        logger.exception("Something went wrong with question answering.")
        raise err
    if answerset.answers:
        self.update_state(state='ANSWERS FOUND')
        logger.info("Answers found.")
    else:
        logger.exception("Question answering completed: no answers found.")
        raise ValueError("Question answering completed: no answers found.")

    logger.info("Done answering.")
    return answerset
