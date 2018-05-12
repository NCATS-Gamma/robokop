'''
Blueprint for /api/questions endpoints
'''

from datetime import datetime
import re
import random
import string
from flask import jsonify, request
from flask_security import auth_required, current_user
from flask_restplus import Resource

from util import getAuthData, get_tasks
from question import list_questions, list_questions_by_username, Question
from tasks import update_kg, answer_question
from setup import api

# New Question Submission
@api.route('/questions/')
class QuestionsAPI(Resource):
    @auth_required('session', 'basic')
    @api.response(201, 'Question created')
    @api.doc(params={
        'name': 'Name of question',
        'natural_question': 'Natural-language question',
        'notes': 'Notes',
        'query': 'Machine-readable question'})
    def post(self):
        """Create new question"""
        user_id = current_user.id
        name = request.json['name']
        natural_question = request.json['natural']
        notes = request.json['notes']
        nodes, edges = Question.dictionary_to_graph(request.json['machine_question'])
        qid = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=12))
        q = Question(id=qid, user_id=user_id, name=name, natural_question=natural_question, notes=notes, nodes=nodes, edges=edges)

        # To speed things along we start a answerset generation task for this question
        # This isn't the standard answerset generation task because we might also trigger a KG Update
        ug_task = update_kg.signature(args=[q.hash], kwargs={'question_id':qid, 'user_email':current_user.email}, immutable=True)
        as_task = answer_question.signature(args=[q.hash], kwargs={'question_id':qid, 'user_email':current_user.email}, immutable=True)
        task = answer_question.apply_async(args=[q.hash], kwargs={'question_id':qid, 'user_email':current_user.email},
            link_error=ug_task|as_task)

        return qid, 201

    @api.response(200, 'Success')
    def get(self):
        """Get list of questions"""
        user = getAuthData()
        question_list = list_questions()
        # user_question_list = list_questions_by_username(user['username'])
        # nonuser_question_list = list_questions_by_username(user['username'], invert=True)

        tasks = get_tasks().values()

        # filter out the SUCCESS/FAILURE tasks
        tasks = [t for t in tasks if not (t['state'] == 'SUCCESS' or t['state'] == 'FAILURE')]

        # get question hashes
        question_hashes = [re.match(r"\['(.*)'\]", t['args']).group(1) if t['args'] else None for t in tasks]

        # split into answer and update tasks
        task_types = ['answering' if t['name'] == 'tasks.answer_question' else
                    'refreshing KG' if t['name'] == 'tasks.update_kg' else
                    'initializing' for t in tasks]

        def augment_info(question):
            answerset_timestamps = [a.timestamp for a in question.answersets]
            latest_idx = answerset_timestamps.index(max(answerset_timestamps)) if answerset_timestamps else None
            latest_answerset_id = question.answersets[latest_idx].id if latest_idx else None
            latest_answerset_timestamp = question.answersets[latest_idx].timestamp if latest_idx else None
            q = question.toJSON()
            q['user_email'] = question.user.email
            q.pop('user_id')
            q.pop('nodes')
            q.pop('edges')
            tasks = [task_types[i] for i in [j for j, h in enumerate(question_hashes) if h == question.hash]]
            return {'latest_answerset_id': latest_answerset_id,
                    'latest_answerset_timestamp': latest_answerset_timestamp.isoformat() if latest_answerset_timestamp else None,
                    'tasks': tasks,
                    **q}

        return {'user': user,\
                'questions': [augment_info(q) for q in question_list]}, 200
