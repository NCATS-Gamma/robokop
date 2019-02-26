"""Blueprint for /api/messages endpoints."""

import logging
from flask import request
from flask_security import auth_required
from flask_restful import Resource

from manager.setup import api
from manager.user import get_user_by_email
from manager.util import getAuthData
import manager.logging_config
from manager.tables_accessors import add_question, add_answerset, get_qgraph_id_by_question_id, get_question_by_id, get_answerset_by_id
from manager.tasks import answer_question, update_kg

logger = logging.getLogger(__name__)


# class MessagesAPI(Resource):
#     """Messages endpoint."""

#     @auth_required('session', 'basic')
#     def post(self, question_id):
#         """
#         Store an answer message for a question
#         ---
#         tags: [question]
#         requestBody:
#             name: message
#             content:
#                 application/json:
#                     schema:
#                         $ref: '#/components/schemas/Message'
#             required: true
#         responses:
#             201:
#                 description: "question id"
#                 content:
#                     text/plain:
#                         schema:
#                             type: string
#         """
#         auth = request.authorization
#         if auth:
#             user_email = auth.username
#             user = get_user_by_email(user_email)
#             user_id = user['id']
#         else:
#             user = getAuthData()
#             user_id = user['user_id']
#             user_email = user['email']
#         logger.debug(f"Creating new question for user {user_email}.")
#         logger.debug(request.json)
#         qgraph_id = get_qgraph_id_by_question_id(question_id)
#         mid = add_answerset(request.json, qgraph_id=qgraph_id)

#         return mid, 201

# api.add_resource(MessagesAPI, '/q/<question_id>/answers')


class QuestionsAPI(Resource):
    """Questions endpoint."""

    @auth_required('session', 'basic')
    def post(self):
        """
        Create a question.
        ---
        tags: [question]
        requestBody:
            name: question
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/Question'
            required: true
        responses:
            201:
                description: "question id"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        auth = request.authorization
        if auth:
            user_email = auth.username
            user = get_user_by_email(user_email)
            user_id = user['id']
        else:
            user = getAuthData()
            user_id = user['id']
            user_email = user['email']

        logger.debug(f"Creating new question for user {user_email}.")
        request_json = request.json
        if 'question_graph' not in request_json:
            request_json['question_graph'] = request_json.pop('machine_question', None)
        
        question_id = add_question(request.json, owner_id=user_id)

        if request.headers.get('RebuildCache', default='true') == 'true':
            # To speed things along we start an answerset generation task for this question
            # This isn't the standard answerset generation task because we might also trigger a KG Update
            
            logger.info(f'Adding update and answer tasks for question {question_id} for user {user_email} to the queue')
            ug_task = update_kg.signature(args=[question_id], kwargs={'user_email':user_email}, immutable=True)
            as_task = answer_question.signature(args=[question_id], kwargs={'user_email':user_email}, immutable=True)
            task = answer_question.apply_async(args=[question_id], kwargs={'user_email':user_email}, link_error=ug_task|as_task)
            logger.info(f'Update task for question {question_id} for user {user_email} to the queue has recieved task_id {task.id}')

        elif request.headers.get('AnswerNow', default='true') == 'true':
            logger.info(f'Adding answer task for question {question_id} for user {user_email} to the queue')
            task = answer_question.apply_async(args=[question_id], kwargs={'user_email': user_email})
            logger.info(f'Answer task for question {question_id} for user {user_email} to the queue has recieved task_id {task.id}')

        return question_id, 201

api.add_resource(QuestionsAPI, '/questions/')
