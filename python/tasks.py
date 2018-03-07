import logging
import time
from setup import app, mail
from celery import Celery
from flask_mail import Message
from question import get_question_by_id

# set up Celery
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

# set up logger
logger = logging.getLogger("robokop")

@celery.task
def wait_and_email():
    logger.info("Waiting to email...")
    time.sleep(20)
    with app.app_context():
        msg = Message("ROBOKOP: Test",
                      sender="robokop@sandboxa74aec7033c545a6aa4e43bdf8271f0b.mailgun.org",
                      recipients=["patrick@covar.com"],
                      body="I'm in a subprocess.")
        mail.send(msg)

@celery.task
def answer_question(question_id):
    logger.info("Answering your question...")

    question = get_question_by_id(question_id)
    question.answer()

    logger.info("Done answering.")