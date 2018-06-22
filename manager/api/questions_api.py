'''
Blueprint for /api/questions endpoints
'''

from datetime import datetime
import re
import random
import string
import logging
from flask import jsonify, request, abort
from flask_security import auth_required, current_user
from flask_restful import Resource

from manager.util import getAuthData, get_tasks
from manager.question import list_questions, list_questions_by_username, Question
from manager.tasks import update_kg, answer_question
from manager.setup import api
from manager.user import User, get_user_by_email
import manager.logging_config

logger = logging.getLogger(__name__)

# New Question Submission
class QuestionsAPI(Resource):
    @auth_required('session', 'basic')
    def post(self):
        """
        Create new question
        ---
        tags: [question]
        parameters:
          - in: body
            name: question
            schema:
                $ref: '#/definitions/Question'
            required: true
          - name: RebuildCache
            in: header
            description: flag indicating whether to update the cached knowledge graph
            required: false
            default: true
            type: string
          - name: AnswerNow
            in: header
            description: flag indicating whether to find answers for the question
            required: false
            default: true
            type: string
        responses:
            201:
                description: "question id"
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
        qid = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=12))
        if not request.json['name']:
            return abort(400, "Question needs a name.")
        q = Question(request.json, id=qid, user_id=user_id)

        if not 'RebuildCache' in request.headers or request.headers['RebuildCache'] == 'true':
            # To speed things along we start a answerset generation task for this question
            # This isn't the standard answerset generation task because we might also trigger a KG Update
            ug_task = update_kg.signature(args=[qid], kwargs={'user_email':user_email}, immutable=True)
            as_task = answer_question.signature(args=[qid], kwargs={'user_email':user_email}, immutable=True)
            task = answer_question.apply_async(args=[qid], kwargs={'user_email':user_email},
                link_error=ug_task|as_task)
        elif not 'AnswerNow' in request.headers or request.headers['AnswerNow'] == 'true':
            task = answer_question.apply_async(args=[qid], kwargs={'user_email':user_email})

        return qid, 201

    def get(self):
        """
        Get list of questions
        ---
        tags: [question]
        responses:
            200:
                description: list of questions
                schema:
                    type: "array"
                    items:
                        $ref: '#/definitions/Question'
        """
        user = getAuthData()
        question_list = list_questions()
        # user_question_list = list_questions_by_username(user['username'])
        # nonuser_question_list = list_questions_by_username(user['username'], invert=True)

        tasks = get_tasks().values()

        # filter out the SUCCESS/FAILURE tasks
        tasks = [t for t in tasks if not (t['state'] == 'SUCCESS' or t['state'] == 'FAILURE' or t['state'] == 'REVOKED')]

        # get question hashes
        question_tasks = {q.id:[] for q in question_list}
        for t in tasks:
            if not t['args']:
                continue
            match = re.match(r"[\[(]'(.*)',?[)\]]", t['args'])
            if not match:
                continue
            question_id = match.group(1)
            question_tasks[question_id].append(t)

        # split into answer and update tasks
        for t in tasks:
            t['type'] = 'answering' if t['name'] == 'manager.tasks.answer_question' else \
                'refreshing KG' if t['name'] == 'manager.tasks.update_kg' else \
                'something?'

        def augment_info(question):
            answerset_timestamps = [a.timestamp for a in question.answersets]
            if answerset_timestamps:
                latest_idx = answerset_timestamps.index(max(answerset_timestamps))
                latest_answerset_id = question.answersets[latest_idx].id
                latest_answerset_timestamp = question.answersets[latest_idx].timestamp
            else:
                latest_answerset_id = None
                latest_answerset_timestamp = None
            q = question.toJSON()
            q['user_email'] = question.user.email
            q.pop('user_id')
            q.pop('machine_question')
            return {'latest_answerset_id': latest_answerset_id,
                    'latest_answerset_timestamp': latest_answerset_timestamp.isoformat() if latest_answerset_timestamp else None,
                    'tasks': [t['type'] for t in question_tasks[question.id]],
                    **q}

        return [augment_info(q) for q in question_list], 200

api.add_resource(QuestionsAPI, '/questions/')
