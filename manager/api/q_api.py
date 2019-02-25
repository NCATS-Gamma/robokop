'''
Blueprint for /api/q/* endpoints
'''

import os
import sys
import re
import json
import logging
from datetime import datetime
import requests
from flask import jsonify, request
from flask_security import auth_required
from flask_restful import Resource

from manager.tables_accessors import get_question_by_id, delete_question_by_id, modify_question_by_id
from manager.task import Task
from manager.user import get_user_by_email
from manager.tasks import answer_question, update_kg
from manager.util import getAuthData
from manager.setup import api
from manager.setup_db import engine
import manager.logging_config
import manager.api.definitions
from manager.celery_monitor import get_messages

logger = logging.getLogger(__name__)

class AnswersetAPI(Resource):

    def get(self, qid_aid):
        """
        Get message for question/answerset.
        ---
        tags: [answerset]
        parameters:
          - in: path
            name: qid_aid
            description: "<question_id>_<answerset_id>"
            schema:
                type: string
            required: true
          - in: query
            name: include_kg
            description: Flag indicating whether to fetch the knowledge graph.
            schema:
                type: boolean
            default: false
        responses:
            200:
                description: "question edited"
                content:
                    text/plain:
                        schema:
                            type: string
            401:
                description: "unauthorized"
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
        question_id, answerset_id = qid_aid.split('_')
        include_kg = request.args.get('include_kg', default=False)
        include_kg = include_kg if isinstance(include_kg, bool) else True if isinstance(include_kg, str) and include_kg == 'true' else False
        query = f"""{{
            question: questionById(id: "{question_id}") {{
                id
                naturalQuestion
                question_graph: qgraphByQgraphId {{
                    id
                    body
                }}
                qgraphByQgraphId {{
                    answersetsByQgraphIdList(condition: {{id: "{answerset_id}"}}) {{
                        answersByAnswersetIdAndQgraphIdList {{
                            body
                        }}
                    }}
                }}
            }}
        }}"""
        request_body = {'query': query}
        url = f'http://{os.environ["GRAPHQL_HOST"]}:{os.environ["GRAPHQL_PORT"]}/graphql'
        response = requests.post(url, json=request_body)
        graphql_out = response.json()
        question_graph = json.loads(graphql_out['data']['question']['question_graph']['body'])
        answers = graphql_out['data']['question']['qgraphByQgraphId']['answersetsByQgraphIdList'][-1]['answersByAnswersetIdAndQgraphIdList']
        answers = [json.loads(answer['body']) for answer in answers]
        message = {
            'question_graph': question_graph,
            'answers': answers
        }
        if include_kg:
            url = f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/knowledge_graph'
            
            response = requests.post(url, json=message)
            if response.status_code >= 300:
                return 'Trouble contacting the ranker, there is probably a problem with the neo4j database', 500

            message['knowledge_graph'] = response.json()
        return message, 200

api.add_resource(AnswersetAPI, '/a/<qid_aid>/')


class QuestionAPI(Resource):

    def get(self, question_id):
        """
        Get message for question.
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
            200:
                description: "question edited"
                content:
                    text/plain:
                        schema:
                            type: string
            401:
                description: "unauthorized"
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
        query = f"""{{
            question: questionById(id: "{question_id}") {{
                id
                naturalQuestion
                question_graph: qgraphByQgraphId {{
                    id
                    body
                }}
            }}
        }}"""
        request_body = {'query': query}
        url = f'http://{os.environ["GRAPHQL_HOST"]}:{os.environ["GRAPHQL_PORT"]}/graphql'
        response = requests.post(url, json=request_body)
        graphql_out = response.json()
        question = graphql_out['data']['question']
        if not isinstance(question, dict):
            return "Unknown question id", 402
        logger.debug(graphql_out)
        question_graph = json.loads(question['question_graph']['body'])
        natural_question = question['naturalQuestion']
        message = {
            'natural_question': natural_question,
            'question_graph': question_graph
        }

        return message, 200

    @auth_required('session', 'basic')
    def post(self, question_id):
        """
        Edit question metadata
        ---
        tags: [question]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            schema:
                type: string
            required: true
        requestBody:
            description: request body
            content:
                application/json:
                    schema:
                        type: object
                        required:
                          - name
                          - natural_question
                          - notes
                        properties:
                            name:
                                description: "name of question"
                                schema:
                                    type: string
                            natural_question:
                                description: "natural-language question"
                                schema:
                                    type: string
                            notes:
                                description: "notes"
                                schema:
                                    type: string
        responses:
            200:
                description: "question edited"
                content:
                    text/plain:
                        schema:
                            type: string
            401:
                description: "unauthorized"
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
            user_id = user['id']
        else:
            user = getAuthData()
            user_id = user['id']
            user_email = user['email']
        
        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question id.", 404
        
        if not (user_email == question['owner_email'] or user['is_admin']):
            return "UNAUTHORIZED", 401 # not authorized

        # User is authorized
        logger.info('Editing question %s at the request of %s', question_id, user_email)
        mods = {}
        if 'notes' in request.json:
            mods['notes'] = request.json['notes']
        if 'natural_question' in request.json:
            mods['natural_question'] = request.json['natural_question']
        
        modify_question_by_id(question_id, mods)

        return "SUCCESS", 200

    @auth_required('session', 'basic')
    def delete(self, question_id):
        """
        Delete question
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
            200:
                description: "question deleted"
                content:
                    text/plain:
                        schema:
                            type: string
            401:
                description: "unauthorized"
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
            user_id = user['id']
        else:
            user = getAuthData()
            user_id = user['id']
            user_email = user['email']
        
        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question id.", 404
        
        if not (user_email == question['owner_email'] or user['is_admin']):
            return "UNAUTHORIZED", 401 # not authorized

        # User is authoriced
        logger.info('Deleting question %s at the request of %s', question_id, user_email)
        delete_question_by_id(question_id)

        return "SUCCESS", 200

api.add_resource(QuestionAPI, '/q/<question_id>/')


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
            user_id = user['id']
        else:
            user = getAuthData()
            user_id = user['id']
            user_email = user['email']

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
            user_id = user['id']
        else:
            user = getAuthData()
            user_id = user['id']
            user_email = user['email']
        
        # Update the knowledge graph for a question
        logger.info(f'Adding update task for question {question_id} for user {user_email} to the queue')
        task = update_kg.apply_async(
            args=[question_id],
            kwargs={'user_email': user_email}
        )
        logger.info(f'Update task for question {question_id} for user {user_email} to the queue has recieved task_id {task.id}')
        return {'task_id': task.id}, 202

api.add_resource(RefreshKG, '/q/<question_id>/refresh_kg/')
