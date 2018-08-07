"""Monitor celery tasks."""
import os
import logging
import re
import json

import pika

from manager.task import Task
import manager.logging_config

logger = logging.getLogger(__name__)

def initialize():
    connection = pika.BlockingConnection(pika.ConnectionParameters(
        host=os.environ['BROKER_HOST'],
        virtual_host='manager',
        credentials=pika.credentials.PlainCredentials(os.environ['BROKER_USER'], os.environ['BROKER_PASSWORD'])))
    channel = connection.channel()

    channel.exchange_declare(exchange='manager', exchange_type='topic', durable=True)
    channel.queue_declare(queue='manager_log')
    channel.queue_bind(queue='manager_log', exchange='manager', routing_key='manager.*')

initialize()

def get_messages():
    """Get rabbitmq messages relevant to task initiation."""
    connection = pika.BlockingConnection(pika.ConnectionParameters(
        host=os.environ['BROKER_HOST'],
        virtual_host='manager',
        credentials=pika.credentials.PlainCredentials(os.environ['BROKER_USER'], os.environ['BROKER_PASSWORD'])))
    channel = connection.channel()

    # def callback(ch, method_frame, properties, body):
    #     body = body.decode()
    #     print(f" [x] Received {body}")

    # channel.basic_consume(callback,
    #                       queue='manager_log',
    #                       no_ack=False)

    # print(' [*] Waiting for messages. To exit press CTRL+C')
    # channel.start_consuming()

    # print(channel.get_waiting_message_count())
    # while channel.get_waiting_message_count():
    #     method_frame, properties, body = channel.consume('manager_log')

    for method_frame, properties, body in channel.consume('manager_log', inactivity_timeout=0.0001):
        if body is None:
            break
        body = json.loads(body.decode())
        headers = properties.headers

        qid = re.match(r"[\[(]'(.*)',?[)\]]", headers['argsrepr']).group(1)

        initiator = body[1]['user_email']

        # create task
        # it will be stored in the postgres database
        Task(id=headers['id'], question_id=qid, type=headers['task'], initiator=initiator)
        logger.debug(f'Got task {headers["id"]}')

        # print(f" [x] Received {body}")
        channel.basic_ack(delivery_tag=method_frame.delivery_tag)

    # # Cancel the consumer and return any pending messages
    # requeued_messages = channel.cancel()
    # print(f'Requeued {requeued_messages} messages')

    # Close the channel and the connection
    channel.close()
    connection.close()
