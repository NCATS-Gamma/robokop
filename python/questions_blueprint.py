from datetime import datetime
import re
import os
import requests
from flask import Blueprint, jsonify, render_template
from util import getAuthData, get_tasks

from question import list_questions, list_questions_by_username

questions = Blueprint('question_list', __name__,
                        template_folder='templates')

# QuestionList
@questions.route('/')
def questions_page():
    """Initial contact. Give the initial page."""
    return render_template('questions.html')

@questions.route('/data', methods=['GET'])
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