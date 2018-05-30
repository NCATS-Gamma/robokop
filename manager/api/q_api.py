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
from manager.answer import list_answersets_by_question_hash
from manager.feedback import list_feedback_by_question
from manager.tasks import answer_question, update_kg
from manager.util import getAuthData, get_tasks
from manager.setup import db, api
from manager.logging_config import logger
import manager.api.definitions

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
            type: string
            required: true
            example: A2T8TK8uxaEy
        responses:
            200:
                description: question
                schema:
                    $ref: '#/definitions/Question'
            404:
                description: "invalid question key"
        """

        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question key.", 404

        user = getAuthData()
        answerset_list = list_answersets_by_question_hash(question.hash)

        return {'user': user,
                'question': question.toJSON(),
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
            type: string
            required: true
          - in: body
            name: name
            description: "name of question"
            required: true
          - in: body
            name: natural_question
            description: "natural-language question"
            required: true
          - in: body
            name: notes
            description: "notes"
            required: true
        responses:
            200:
                description: "question edited"
            401:
                description: "unauthorized"
            404:
                description: "invalid question key"
        """
        logger.info('Editing question %s', question_id)
        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question key.", 404
        if not (current_user == question.user or current_user.has_role('admin')):
            return "UNAUTHORIZED", 401 # not authorized
        question.name = request.json['name']
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
            type: string
            required: true
        responses:
            200:
                description: "question deleted"
            401:
                description: "unauthorized"
            404:
                description: "invalid question key"
        """
        logger.info('Deleting question %s', question_id)
        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question key.", 404
        if not (current_user == question.user or current_user.has_role('admin')):
            return "UNAUTHORIZED", 401 # not authorized
        db.session.delete(question)
        db.session.commit()
        return "SUCCESS", 200

api.add_resource(QuestionAPI, '/q/<question_id>')

# get feedback by question
class GetFeedbackByQuestion(Resource):
    def get(self, question_id):
        """
        Create new feedback
        ---
        tags: [feedback]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            type: string
            required: true
        responses:
            200:
                description: success
            404:
                description: "invalid question key"
        """
        try:
            question = get_question_by_id(question_id)
            feedback = list_feedback_by_question(question)
        except Exception as err:
            return "Invalid question id", 404

        return feedback.toJSON(), 200

api.add_resource(GetFeedbackByQuestion, '/q/<question_id>/feedback')

class AnswerQuestion(Resource):
    @auth_required('session', 'basic')
    def post(self, question_id):
        """
        Answer question
        ---
        tags: [answer]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            type: string
            required: true
        responses:
            202:
                description: "answering in progress"
                type: string
            404:
                description: "invalid question key"
                type: string
        """
        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question key.", 404
        username = current_user.username
        # Answer a question
        task = answer_question.apply_async(args=[question.hash], kwargs={'question_id':question_id, 'user_email':current_user.email})
        return {'task_id':task.id}, 202

api.add_resource(AnswerQuestion, '/q/<question_id>/answer')

class RefreshKG(Resource):
    @auth_required('session', 'basic')
    def post(self, question_id):
        """
        Refresh KG for question
        ---
        tags: [cache]
        parameters:
          - in: path
            name: question_id
            description: "question id"
            type: string
            required: true
        responses:
            202:
                description: "refreshing in progress"
                type: string
            404:
                description: "invalid question key"
                type: string
        """
        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question key.", 404
        question_hash = question.hash
        username = current_user.username
        # Update the knowledge graph for a question
        task = update_kg.apply_async(args=[question_hash], kwargs={'question_id':question_id, 'user_email':current_user.email})
        return {'task_id':task.id}, 202

api.add_resource(RefreshKG, '/q/<question_id>/refresh_kg')

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
            type: string
            required: true
        responses:
            200:
                description: tasks
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
                type: string
        """

        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question key.", 404

        question_hash = question.hash

        tasks = list(get_tasks().values())

        # filter out the SUCCESS/FAILURE tasks
        tasks = [t for t in tasks if not (t['state'] == 'SUCCESS' or t['state'] == 'FAILURE' or t['state'] == 'REVOKED')]

        # filter out tasks for other questions
        question_tasks = []
        for t in tasks:
            if not t['args']:
                continue
            match = re.match(r"[\[(]'(.*)',?[)\]]", t['args'])
            if match:
                if match.group(1) == question_hash:
                    question_tasks.append(t)

        # split into answer and update tasks
        answerers = [t for t in question_tasks if t['name'] == 'manager.tasks.answer_question']
        updaters = [t for t in question_tasks if t['name'] == 'manager.tasks.update_kg']

        return {'answerers': answerers,
                'updaters': updaters}, 200

api.add_resource(QuestionTasks, '/q/<question_id>/tasks')

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
            type: string
            required: true
        responses:
            200:
                description: xxx
                schema:
                    $ref: '#/definitions/Graph'
            404:
                description: "invalid question key"
                type: string
        """

        try:
            question = get_question_by_id(question_id)
        except Exception as err:
            return "Invalid question key.", 404

        logger.debug(question.toJSON())
        r = requests.post(f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/subgraph", json=question.toJSON())
        try:
            output = r.json()
        except Exception as err:
            raise ValueError("Response is not JSON.")
        return output, 200

api.add_resource(QuestionSubgraph, '/q/<question_id>/subgraph')
