'''
Blueprint for /api/questions endpoints
'''

from datetime import datetime
import re
import os
import requests
import random
import string
from flask import Blueprint, jsonify, render_template, request
from flask_security import auth_required, current_user
from util import getAuthData, get_tasks

from question import list_questions, list_questions_by_username, Question
from tasks import initialize_question

questions_api = Blueprint('questions_api', __name__,
                        template_folder='templates')

# New Question Submission
@questions_api.route('/', methods=['POST'])
@auth_required('session', 'basic')
def new_from_post():
    print("creating new question")
    """Trigger creation of a new question"""
    user_id = current_user.id
    name = request.json['name']
    natural_question = request.json['natural']
    notes = request.json['notes']
    nodes, edges = Question.dictionary_to_graph(request.json['query'])
    qid = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=12))
    q = Question(id=qid, user_id=user_id, name=name, natural_question=natural_question, notes=notes, nodes=nodes, edges=edges)

    # To speed things along we start a answerset generation task for this question
    # This isn't the standard answerset generation task because we might also trigger a KG Update
    task = initialize_question.apply_async(args=[q.hash], kwargs={'question_id':qid, 'user_email':current_user.email})

    return qid, 201

@questions_api.route('/', methods=['GET'])
def questions_data():
    """Data for the list of questions """

    user = getAuthData()
    question_list = list_questions()
    user_question_list = list_questions_by_username(user['username'])
    # nonuser_question_list = list_questions_by_username(user['username'], invert=True)

    tasks = get_tasks().values()

    # filter out the SUCCESS/FAILURE tasks
    tasks = [t for t in tasks if not (t['state'] == 'SUCCESS' or t['state'] == 'FAILURE')]

    # get question hashes
    question_hashes = [re.match("\['(.*)'\]", t['args']).group(1) if t['args'] else None for t in tasks]

    # split into answer and update tasks
    task_types = ['answering' if t['name'] == 'tasks.answer_question' else
                  'refreshing KG' if t['name'] == 'tasks.update_kg' else
                  'initializing' for t in tasks]

    def augment_info(question):
        answerset_timestamps = [a.timestamp for a in question.answersets]
        latest_idx = answerset_timestamps.index(max(answerset_timestamps))
        latest_answerset_id = question.answersets[latest_idx].id
        latest_answerset_timestamp = question.answersets[latest_idx].timestamp
        q = question.toJSON()
        q.pop('user_id')
        q.pop('nodes')
        q.pop('edges')
        tasks = [task_types[i] for i in [j for j, h in enumerate(question_hashes) if h == question.hash]]
        return {
            'latest_answerset_id':latest_answerset_id,
            'latest_answerset_timestamp':latest_answerset_timestamp,
            'tasks':tasks,
            **q}

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
                    'user': user,\
                    'questions': [augment_info(q) for q in question_list],\
                    'user_questions': [augment_info(q) for q in user_question_list]})
