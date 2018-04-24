#!/usr/bin/env python

"""Flask web server thread"""

import os
import json
import logging
import time
import string
import random
import requests
import re
import sys
from datetime import datetime

from flask import Flask, jsonify, request, render_template, url_for, redirect
from flask_security import Security, SQLAlchemySessionUserDatastore, auth_required
from flask_security.core import current_user
from flask_login import LoginManager, login_required

from setup import app, db
from logging_config import logger
from user import User, Role, list_users
from question import Question, list_questions, get_question_by_id, list_questions_by_username, list_questions_by_hash
from answer import get_answerset_by_id, list_answersets_by_question_hash, get_answer_by_id, list_answers_by_answerset, list_answersets
from feedback import Feedback, list_feedback_by_answer
from tasks import celery, answer_question, update_kg, initialize_question

greent_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-interfaces')
sys.path.insert(0, greent_path)
from greent import node_types

# Setup flask-security with user tables
user_datastore = SQLAlchemySessionUserDatastore(db.session, User, Role)
security = Security(app, user_datastore)

# Initialization
@app.before_first_request
def init():
    pass

# Flask Server code below
################################################################################

class InvalidUsage(Exception):
    """Error handler class to translate python exceptions to json messages"""
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    """Error handler to translate python exceptions to json messages"""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def getAuthData():
    """ Return relevant information from flask-login current_user"""
    # is_authenticated
    #   This property should return True if the user is authenticated, i.e. they have provided valid credentials. (Only authenticated users will fulfill the criteria of login_required.)
    # is_active
    #   This property should return True if this is an active user - in addition to being authenticated, they also have activated their account, not been suspended, or any condition your application has for rejecting an account. Inactive accounts may not log in (without being forced of course).
    # is_anonymous
    #   This property should return True if this is an anonymous user. (Actual users should return False instead.)

    is_authenticated = current_user.is_authenticated
    is_active = current_user.is_active
    is_anonymous = current_user.is_anonymous
    if is_anonymous:
        username = "Anonymous"
        is_admin = False
    else:
        username = current_user.username
        is_admin = current_user.has_role('admin')

    return {'is_authenticated': is_authenticated,\
            'is_active': is_active,\
            'is_anonymous': is_anonymous,\
            'is_admin': is_admin,\
            'username': username}
            
@app.route('/status/<task_id>')
def taskstatus(task_id):
    task = celery.AsyncResult(task_id)
    return task.state

def get_tasks():
    flower_url = 'http://{}:{}/api/tasks'.format(os.environ['FLOWER_ADDRESS'], os.environ['FLOWER_PORT'])
    response = requests.get(flower_url, auth=(os.environ['FLOWER_USER'], os.environ['FLOWER_PASSWORD']))
    return response.json()

# from celery.app.control import Inspect
@app.route('/tasks')
def show_tasks():
    """Fetch queued/active task list"""
    tasks = get_tasks()
    output = []
    output.append('{:<40}{:<30}{:<40}{:<20}{:<20}'.format('task id', 'name', 'question hash', 'user', 'state'))
    output.append('-'*150)
    for task_id in tasks:
        task = tasks[task_id]
        name = task['name'] if task['name'] else ''
        question_hash = re.match("\['(.*)'\]", task['args']).group(1) if task['args'] else ''
        user_email = re.match("\{'user_email': '(.*)'\}", task['kwargs']).group(1) if task['kwargs'] else ''
        state = task['state'] if task['state'] else ''
        output.append('{:<40}{:<30}{:<40}{:<20}{:<20}'.format(task_id, name, question_hash, user_email, state))

    return "<pre>"+"\n".join(output)+"</pre>"

@app.route('/')
def landing():
    """Initial contact. Give the initial page."""
    return render_template('landing.html')

@app.route('/landing/data', methods=['GET'])
def landing_data():
    """Data for the landing page."""

    user = getAuthData()

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user})

# Account information
@app.route('/account')
@login_required
def account():
    """Deliver user info page"""
    return render_template('account.html')

@app.route('/account/data', methods=['GET'])
@auth_required('session', 'basic')
def account_data():
    """Data for the current user"""

    user = getAuthData()

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user})

# New Question Interface
@app.route('/q/new', methods=['GET'])
def new():
    """Deliver new-question interface"""
    return render_template('questionNew.html',  question_id=None)

# New Question Submission
@app.route('/q/new', methods=['POST'])
@auth_required('session', 'basic')
def new_from_post():
    """Trigger creation of a new question, or prepopulate question new page"""
    # This is a little bit of a hack to double use this POST entry
    # In the future we could update the post request spec to make this more explicit

    # If you make a post request with a question_id we will assume you want a new question editor
    # we will prepopulate the question new page with data from that question (if it is a valid question id)
    if 'question_id' in request.form:
        return render_template('questionNew.html', question_id=request.form['question_id'])
    
    # Otherwise, we assume you are submitting a new question with all other data
    # in which case you dont know the question id so you didn't give me one (right?)
    user_id = current_user.id
    name = request.json['name']
    natural_question = request.json['natural']
    notes = request.json['notes']
    nodes, edges = Question.dictionary_to_graph(request.json['query'])
    qid = ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=12))
    q = Question(id=qid, user_id=user_id, name=name, natural_question=natural_question, notes=notes, nodes=nodes, edges=edges)

    # At this point the question is finished
    # Returning the question id will tell the UI to re-route to the corresponding question page
    # To speed things along we start a answerset generation task for this question
    # This isn't the standard answerset generation task because we might also trigger a KG Update
    task = initialize_question.apply_async(args=[q.hash], kwargs={'question_id':qid, 'user_email':current_user.email})

    return qid, 201

@app.route('/q/new/data', methods=['GET', 'POST'])
def new_data():
    """Data for the new-question interface"""
    initialization_id = request.json['initialization_id'] if 'initialization_id' in request.json else None

    question = {}
    if initialization_id and not initialization_id == 'None':
        question = get_question_by_id(initialization_id)
        question = question.toJSON()
    
    user = getAuthData()

    concepts = list(node_types.node_types - {'UnspecifiedType'})

    now_str = datetime.now().__str__()
    return jsonify({\
        'timestamp': now_str,\
        'question': question,
        'concepts': concepts,
        'user': user})

# QuestionList
@app.route('/questions')
def questions():
    """Initial contact. Give the initial page."""
    return render_template('questions.html')

@app.route('/questions/data', methods=['GET'])
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
        latest_idx = answerset_timestamps.index(max(answerset_timestamps)) if answerset_timestamps else None
        latest_answerset_id = question.answersets[latest_idx].id if latest_idx else None
        latest_answerset_timestamp = question.answersets[latest_idx].timestamp if latest_idx else None
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

# Question
@app.route('/q/<question_id>', methods=['GET'])
def question(question_id):
    """Deliver user info page"""
    return render_template('question.html', question_id=question_id)

@app.route('/q/<question_id>', methods=['POST'])
@auth_required('session', 'basic')
def question_action(question_id):
    """ run update or answer actions """
    question_hash = get_question_by_id(question_id).hash
    username = current_user.username
    command = request.json['command']
    if 'answer' in command:
        # Answer a question
        task = answer_question.apply_async(args=[question_hash], kwargs={'question_id':question_id, 'user_email':username})
        return jsonify({'task_id':task.id}), 202
    elif 'update' in command:
        # Update the knowledge graph for a question
        task = update_kg.apply_async(args=[question_hash], kwargs={'question_id':question_id, 'user_email':username})
        return jsonify({'task_id':task.id}), 202

@app.route('/q/<question_id>/data', methods=['GET'])
def question_data(question_id):
    """Data for a question"""

    user = getAuthData()

    question = get_question_by_id(question_id)
    answerset_list = list_answersets_by_question_hash(question.hash)

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,
                    'user': user,
                    'question': question.toJSON(),
                    'owner': question.user.email,
                    'answerset_list': [a.toJSON() for a in answerset_list]})

@app.route('/q/<question_id>/tasks', methods=['GET'])
def question_tasks(question_id):
    """ List of active and queued tasks for only a specific question """

    question_hash = get_question_by_id(question_id).hash

    tasks = get_tasks().values()

    # filter out tasks for other questions
    tasks = [t for t in tasks if (re.match("\['(.*)'\]", t['args']).group(1) if t['args'] else None) == question_hash]

    # filter out the SUCCESS/FAILURE tasks
    tasks = [t for t in tasks if not (t['state'] == 'SUCCESS' or t['state'] == 'FAILURE')]

    # split into answer and update tasks
    answerers = [t for t in tasks if t['name'] == 'tasks.answer_question']
    updaters = [t for t in tasks if t['name'] == 'tasks.update_kg']
    initializers = [t for t in tasks if t['name'] == 'tasks.initialize_question']

    return jsonify({'answerers': answerers,
                    'updaters': updaters,
                    'initializers': initializers})

@app.route('/q/<question_id>/subgraph', methods=['GET'])
def question_subgraph(question_id):
    """Data for a question"""

    question = get_question_by_id(question_id)
    subgraph = question.relevant_subgraph()

    return jsonify(subgraph)

# Answer Set
@app.route('/q/<question_id>/a/<answerset_id>')
def answerset(question_id, answerset_id):
    """Deliver answerset page for a given id"""
    return render_template('answerset.html', question_id=question_id, answerset_id=answerset_id)

@app.route('/q/<question_id>/a/<answerset_id>/data', methods=['GET'])
def answerset_data(question_id, answerset_id):
    """Data for an answerset """

    question = get_question_by_id(question_id)
    answersets = list_answersets_by_question_hash(question.hash)
    answerset_ids = [aset.id for aset in answersets]
    answerset_id = int(answerset_id)

    if not answerset_id in answerset_ids:
        return "Answerset not available for this question", 400 # bad request - question does not have this answerset

    user = getAuthData()
    answerset = get_answerset_by_id(answerset_id)
    answers = list_answers_by_answerset(answerset)
    questions = list_questions_by_hash(answerset.question_hash)
    idx = questions.index(question)
    questions.pop(idx)
    idx = answerset_ids.index(answerset_id)
    answersets.pop(idx)
    answerset_graph = None

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user,\
        'question': question.toJSON(),\
        'answerset': answerset.toJSON(),\
        'answers': [a.toJSON() for a in answers],\
        'other_answersets': [aset.toJSON() for aset in answersets],
        'other_questions': [q.toJSON() for q in questions],\
        'answerset_graph': answerset_graph})

# Answer
@app.route('/q/<question_id>/a/<answerset_id>/<answer_id>')
def answer(question_id, answerset_id, answer_id):
    """Deliver answerset page for a given id"""
    return render_template('answer.html', question_id=question_id, answerset_id=answerset_id, answer_id=answer_id)

@app.route('/q/<question_id>/a/<answerset_id>/<answer_id>/data', methods=['GET'])
def answer_data(question_id, answerset_id, answer_id):
    """Data for an answer """
    
    user = getAuthData()
    if answerset_id == 'test':
        answer = get_answer_by_id(answer_id)
        answerset = get_answerset_by_id(answerset_id)
        questions = list_questions_by_hash(answerset.question_hash)
        feedback = list_feedback_by_answer(answer)
    else:
        answer = get_answer_by_id(answer_id)
        answerset = get_answerset_by_id(answerset_id)
        questions = list_questions_by_hash(answerset.question_hash)
        feedback = list_feedback_by_answer(answer)
    
    return jsonify({'user': user,\
        'answerset': answerset.toJSON(),\
        'answer': answer.toJSON(),\
        'questions': [q.toJSON() for q in questions],\
        'feedback': feedback})

# Admin
@app.route('/admin')
def admin():
    """Deliver admin page"""
    user = getAuthData()

    if user['is_admin']:
        return render_template('admin.html')
    else:
        return redirect(url_for('security.login', next=request.url))

@app.route('/admin/data', methods=['GET'])
def admin_data():
    """Data for admin display """
    
    user = getAuthData()
    
    if not user['is_admin']:
        return redirect(url_for('security.login', next='/admin'))
    else:
        now_str = datetime.now().__str__()
        users = [u.toJSON() for u in list_users()]
        questions = [q.toJSON() for q in list_questions()]
        answersets = [aset.toJSON() for aset in list_answersets()]

        return jsonify({'timestamp': now_str,\
            'users': users,\
            'questions': questions,\
            'answersets': answersets})

################################################################################
##### Account Editing ##########################################################
################################################################################
@app.route('/account/edit', methods=['POST'])
@login_required
def accountEdit():
    """Edit account information (if request is for current_user)"""

################################################################################
##### New Question #############################################################
################################################################################
@app.route('/q/new/search', methods=['POST'])
def question_new_search():
    """Validate/provide suggestions for a search term"""

@app.route('/q/new/validate', methods=['POST'])
def question_new_validate():
    """Validate a machine question to ensure it could possibly be executed"""

@app.route('/q/new/translate', methods=['POST'])
def question_new_translate():
    """Translate a natural language question into a machine question"""

################################################################################
##### Question Editing, Forking ################################################
################################################################################
@app.route('/q/edit', methods=['POST'])
@auth_required('session', 'basic')
def question_edit():
    """Edit the properties of a question"""
    logger.info('Editing question %s', request.json['question_id'])
    q = get_question_by_id(request.json['question_id'])
    if not (current_user == q.user or current_user.has_role('admin')):
        return "UNAUTHORIZED", 401 # not authorized
    q.name = request.json['name']
    q.notes = request.json['notes']
    q.natural_question = request.json['natural_question']
    db.session.commit()
    return "SUCCESS", 200

@app.route('/q/fork', methods=['POST'])
@auth_required('session', 'basic')
def question_fork():
    """Fork a question to form a new question owned by current_user """

@app.route('/q/delete', methods=['POST'])
@auth_required('session', 'basic')
def question_delete():
    """Delete question (if owned by current_user)"""
    logger.info('Deleting question %s', request.json['question_id'])
    q = get_question_by_id(request.json['question_id'])
    if not (current_user == q.user or current_user.has_role('admin')):
        return "UNAUTHORIZED", 401 # not authorized
    db.session.delete(q)
    db.session.commit()
    return "SUCCESS", 200

################################################################################
##### Answer Feedback ##########################################################
################################################################################
@app.route('/a/feedback', methods=['POST'])
def answer_feedback():
    """Set feedback for a specific user to a specific answer"""

################################################################################
##### Admin Interface ##########################################################
################################################################################
@app.route('/admin/q/delete', methods=['POST'])
def admin_question_delete():
    """Delete question (if current_user is admin)"""

@app.route('/admin/q/edit', methods=['POST'])
def admin_question_edit():
    """Edit question (if current_user is admin)"""

@app.route('/admin/u/delete', methods=['POST'])
def admin_user_delete():
    """Delete user (if current_user is admin)"""

@app.route('/admin/u/edit', methods=['POST'])
def admin_user_edit():
    """Delete Edit (if current_user is admin)"""

@app.route('/admin/a/delete', methods=['POST'])
def admin_answerset_delete():
    """Delete Answerset (if current_user is admin)"""


################################################################################
##### Run Webserver ############################################################
################################################################################

if __name__ == '__main__':
    
    # Get host and port from environmental variables
    server_host = os.environ['ROBOKOP_HOST']
    server_port = int(os.environ['ROBOKOP_PORT'])

    app.run(host=server_host,\
        port=server_port,\
        debug=False,\
        use_reloader=False)