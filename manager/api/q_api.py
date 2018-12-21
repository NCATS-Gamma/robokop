'''
Blueprint for /api/q/* endpoints
'''

import os
import sys
import re
import logging
from datetime import datetime
import requests
from flask import jsonify, request
from flask_security import auth_required
from flask_security.core import current_user
from flask_restful import Resource

from manager.graphql_accessors import get_question_by_id
from manager.task import Task
from manager.user import get_user_by_email
from manager.tasks import answer_question, update_kg
from manager.util import getAuthData
from manager.setup import api
import manager.logging_config
import manager.api.definitions
from manager.celery_monitor import get_messages

logger = logging.getLogger(__name__)

class AnswerQuestion(Resource):
    @auth_required('session', 'basic')
    def post(self, question_id):
        """
        Answer question
        ---
        tags: [question]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            schema:
                type: string
            required: true
        responses:
            202:
                description: "answering in progress"
                content:
                    text/plain:
                        schema:
                            type: string
            404:
                description: "invalid question key"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        auth = request.authorization
        if auth:
            user_email = auth.username
            user = get_user_by_email(user_email)
            user_id = user.id
        else:
            user_id = current_user.id
            user_email = current_user.email
        
        logger.info(f'Adding answer task for question {question_id} for user {user_email} to the queue')
        # Answer a question
        task = answer_question.apply_async(
            args=[question_id],
            kwargs={'user_email': user_email}
        )
        logger.info(f'Answer task for question {question_id} for user {user_email} to the queue has recieved task_id {task.id}')
        return {'task_id': task.id}, 202

api.add_resource(AnswerQuestion, '/q/<question_id>/answer/')

class RefreshKG(Resource):
    @auth_required('session', 'basic')
    def post(self, question_id):
        """
        Refresh KG for question
        ---
        tags: [question]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            schema:
                type: string
            required: true
        responses:
            202:
                description: "refreshing in progress"
                content:
                    text/plain:
                        schema:
                            type: string
            404:
                description: "invalid question key"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        auth = request.authorization
        if auth:
            user_email = auth.username
            user = get_user_by_email(user_email)
            user_id = user.id
        else:
            user_id = current_user.id
            user_email = current_user.email
        
        # Update the knowledge graph for a question
        logger.info(f'Adding update task for question {question_id} for user {user_email} to the queue')
        task = update_kg.apply_async(
            args=[question_id],
            kwargs={'user_email': user_email}
        )
        logger.info(f'Update task for question {question_id} for user {user_email} to the queue has recieved task_id {task.id}')
        return {'task_id': task.id}, 202

api.add_resource(RefreshKG, '/q/<question_id>/refresh_kg/')
