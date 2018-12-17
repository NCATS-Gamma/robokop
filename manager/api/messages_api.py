"""Blueprint for /api/messages endpoints."""

import logging
from flask import request
from flask_security import auth_required, current_user
from flask_restful import Resource

from manager.setup import api
from manager.user import get_user_by_email
import manager.logging_config
from manager.graphql_accessors import add_question, add_message

logger = logging.getLogger(__name__)


class MessagesAPI(Resource):
    """Messages endpoint."""

    @auth_required('session', 'basic')
    def post(self):
        """
        Store a message.
        ---
        tags: [storage]
        requestBody:
            name: message
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/Message'
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
            user_id = user.id
        else:
            user_id = current_user.id
            user_email = current_user.email
        logger.debug(f"Creating new question for user {user_email}.")
        logger.debug(request.json)
        mid = add_message(request.json)

        return mid, 201

api.add_resource(MessagesAPI, '/messages/')


class QuestionsAPI(Resource):
    """Questions endpoint."""

    @auth_required('session', 'basic')
    def post(self):
        """
        Store a question.
        ---
        tags: [storage]
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
            user_id = user.id
        else:
            user_id = current_user.id
            user_email = current_user.email
        logger.debug(f"Creating new question for user {user_email}.")
        logger.debug(request.json)
        qid = add_question(request.json, owner_id=user_id)

        return qid, 201

api.add_resource(QuestionsAPI, '/questions/')
