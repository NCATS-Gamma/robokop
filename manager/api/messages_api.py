"""Blueprint for /api/messages endpoints."""

import logging
from flask import request
from flask_security import auth_required, current_user
from flask_restful import Resource

from manager.setup import api
from manager.user import get_user_by_email
import manager.logging_config
from manager.tables_accessors import add_question, add_answerset, get_qgraph_id_by_question_id, get_question_by_id, get_answerset_by_id

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
#             user_id = user.id
#         else:
#             user_id = current_user.id
#             user_email = current_user.email
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
            user_id = user.id
        else:
            user_id = current_user.id
            user_email = current_user.email
        logger.debug(f"Creating new question for user {user_email}.")
        request_json = request.json
        if 'question_graph' not in request_json:
            request_json['question_graph'] = request_json.pop('machine_question', None)
        logger.debug(request.json)
        qid = add_question(request.json, owner_id=user_id)

        return qid, 201

api.add_resource(QuestionsAPI, '/questions/')



class LocalKGAPI(Resource):
    """Endpoint to fetch a local knowledge graph for a particular quesiton given an id."""

    @auth_required('session', 'basic')
    def get(self, q_a_id):
        """
        Get the local knowledge graph for a question.
        ---
        tags: [answerset]
        responses:
            201:
                description: "question id"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        sub_strings = q_a_id.split('_')
        if len(sub_strings) != 2:
            return "Invalid identifier", 404

        q_id = sub_strings[0]
        a_id = sub_strings[1]

        question = get_question_by_id(q_id)
        answerset = get_answerset_by_id(a_id)

        logger.debug(f'Found answerset and question')
        

        return q_id, 201

api.add_resource(LocalKGAPI, '/a/<q_a_id>/subgraph')