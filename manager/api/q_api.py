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

from manager.question import get_question_by_id
from manager.task import Task
from manager.feedback import list_feedback_by_question
from manager.user import get_user_by_email
from manager.tasks import answer_question, update_kg
from manager.util import getAuthData
from manager.setup import db, api
import manager.logging_config
import manager.api.definitions
from manager.celery_monitor import get_messages

logger = logging.getLogger(__name__)

class QuestionAPI(Resource):
    def get(self, question_id):
        """
        Get question
        ---
        tags: [question]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            schema:
                type: string
            required: true
            example: A2T8TK8uxaEy
        responses:
            200:
                description: question
                content:
                    application/json:
                        schema:
                            $ref: '#/definitions/Question'
            404:
                description: "invalid question key"
                content:
                    text/plain:
                        schema:
                            type: string
        """

        try:
            question = get_question_by_id(question_id, session=db.session)
        except Exception as err:
            return "Invalid question key.", 404

        answerset_list = question.answersets

        return {'question': question.to_json(),
                'owner': question.user.email,
                'answerset_list': [a.toStandard(data=False) for a in answerset_list]}, 200

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
        else:
            user = current_user
        logger.info('Editing question %s', question_id)
        try:
            question = get_question_by_id(question_id, session=db.session)
        except Exception as err:
            return "Invalid question key.", 404
        if not (user == question.user or user.has_role('admin')):
            return "UNAUTHORIZED", 401 # not authorized
        question.notes = request.json['notes']
        question.natural_question = request.json['natural_question']
        db.session.commit()
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
        else:
            user = current_user
        logger.info('Deleting question %s', question_id)
        try:
            question = get_question_by_id(question_id, session=db.session)
        except Exception as err:
            return "Invalid question key.", 404
        if not (user == question.user or user.has_role('admin')):
            return "UNAUTHORIZED", 401 # not authorized
        db.session.delete(question)
        db.session.commit()
        return "SUCCESS", 200

api.add_resource(QuestionAPI, '/q/<question_id>/')

# get feedback by question
class GetFeedbackByQuestion(Resource):
    def get(self, question_id):
        """
        Get feedback by question
        ---
        tags: [feedback]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            schema:
                type: string
            required: true
        responses:
            200:
                description: success
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
        try:
            question = get_question_by_id(question_id, session=db.session)
            feedback = list_feedback_by_question(question, session=db.session)
        except Exception as err:
            return "Invalid question id", 404

        return feedback.to_json(), 200

api.add_resource(GetFeedbackByQuestion, '/q/<question_id>/feedback/')

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
        try:
            question = get_question_by_id(question_id, session=db.session)
        except Exception as err:
            return "Invalid question key.", 404
        # Answer a question
        task = answer_question.apply_async(args=[question_id], kwargs={'user_email':user_email})
        return {'task_id':task.id}, 202

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
        try:
            question = get_question_by_id(question_id, session=db.session)
        except Exception as err:
            return "Invalid question key.", 404
        # Update the knowledge graph for a question
        task = update_kg.apply_async(args=[question_id], kwargs={'user_email':user_email})
        return {'task_id':task.id}, 202

api.add_resource(RefreshKG, '/q/<question_id>/refresh_kg/')

class QuestionTasks(Resource):
    def get(self, question_id):
        """
        Get list of queued tasks for question
        ---
        tags: [tasks]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            schema:
                type: string
            required: true
        responses:
            200:
                description: tasks
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                answerers:
                                    type: array
                                    items:
                                        $ref: '#/definitions/Task'
                                updaters:
                                    type: array
                                    items:
                                        $ref: '#/definitions/Task'
            404:
                description: "invalid question key"
                content:
                    text/plain:
                        schema:
                            type: string
        """

        try:
            question = get_question_by_id(question_id, session=db.session)
        except Exception as err:
            return "Invalid question key.", 404

        get_messages()

        tasks = question.tasks
        statuses = [
            {
                'uuid': t.id,
                'type': t.type,
                'timestamp': t.timestamp.isoformat(),
                'initiator': t.initiator,
                'status': t.status
            } for t in tasks]

        return statuses

api.add_resource(QuestionTasks, '/q/<question_id>/tasks/')

class QuestionSubgraph(Resource):
    def get(self, question_id):
        """
        Get question subgraph
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
                description: question subgraph
                content:
                    application/json:
                        schema:
                            $ref: '#/definitions/Graph'
            404:
                description: "invalid question key"
                content:
                    text/plain:
                        schema:
                            type: string
        """

        try:
            question = get_question_by_id(question_id, session=db.session)
        except Exception as err:
            return "Invalid question key.", 404

        logger.debug(question.to_json())
        r = requests.post(f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/subgraph", json=question.to_json())
        try:
            output = r.json()
        except Exception as err:
            raise ValueError("Response is not JSON.")
        return output, 200

api.add_resource(QuestionSubgraph, '/q/<question_id>/subgraph/')
