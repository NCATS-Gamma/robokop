#!/usr/bin/env python

"""Flask web server thread"""
import os
import json
import sqlite3
import subprocess
import logging
from datetime import datetime

from knowledgegraph import KnowledgeGraph
from Storage import Storage

from flask import Flask, jsonify, request, render_template, url_for, redirect
from flask_security import Security, SQLAlchemySessionUserDatastore
from flask_login import LoginManager, login_required
from flask_security.core import current_user

from setup import app, db
from user import User, Role
from question import Question, list_questions, get_question_by_id, list_questions_by_username
from answer import get_answerset_by_id, list_answersets_by_question_hash, get_answer_by_id, list_answers_by_answerset
from feedback import Feedback, list_feedback_by_answer

storage = Storage(db)

# Setup flask-security with user tables
user_datastore = SQLAlchemySessionUserDatastore(db.session, User, Role)
security = Security(app, user_datastore)

# Create a user to test with
@app.before_first_request
def init():
    storage.boot(user_datastore)

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
@login_required
def account_data():
    """Data for the current user"""

    user = getAuthData()

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user})

# New Question
@app.route('/q/new')
def new():
    """Deliver new question"""
    return render_template('questionNew.html')

@app.route('/q/new/data', methods=['GET'])
def new_data():
    """Data for the new question"""

    user = getAuthData()

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
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
    question_list = [q.toJSON() for q in question_list]

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user,\
        'questions': question_list})

# Question
@app.route('/q/<question_id>')
def question(question_id):
    """Deliver user info page"""
    return render_template('question.html', question_id=question_id)

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
                    'answerset_list': [a.toJSON() for a in answerset_list]})

# Answer Set
@app.route('/a/<answerset_id>')
def answerset(answerset_id):
    """Deliver answerset page for a given id"""
    return render_template('answerset.html', answerset_id=answerset_id)

@app.route('/a/<answerset_id>/data', methods=['GET'])
def answerset_data(answerset_id):
    """Data for an answerset """

    user = getAuthData()
    answerset = get_answerset_by_id(answerset_id)
    answers = list_answers_by_answerset(answerset)
    answerset_graph = None #storage.getAnswerSetGraph(answerset_id)

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user,\
        'answerset': answerset.toJSON(),\
        'answers': [a.toJSON() for a in answers],\
        'answerset_graph': answerset_graph})

# Answer
@app.route('/a/<answerset_id>/<answer_id>')
def answer(answerset_id, answer_id):
    """Deliver answerset page for a given id"""
    return render_template('answer.html', answerset_id=answerset_id, answer_id=answer_id)

@app.route('/a/<answerset_id>/<answer_id>/data', methods=['GET'])
def answer_data(answerset_id, answer_id):
    """Data for an answer """
    
    user = getAuthData()
    answer = get_answer_by_id(answer_id)
    feedback = list_feedback_by_answer(answer)
    
    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user,\
        'answer': answer.toJSON(),\
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
        users = storage.getUserList()
        questions = storage.getQuestionList()
        answersets = storage.getAnswerSetList()

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
@app.route('/q/new/update', methods=['POST'])
def question_new_update():
    """Initiate a process for a new question"""

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
def question_edit():
    """Edit the properties of a question"""

@app.route('/q/fork', methods=['POST'])
def question_fork():
    """Fork a question to form a new question owned by current_user """

@app.route('/q/delete', methods=['POST'])
def question_delete():
    """Delete question (if owned by current_user)"""

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
    # Our local config is in the main directory
    
    # We will use this host and port if we are running from python and not gunicorn
    global local_config
    config_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..')
    json_file = os.path.join(config_dir,'config.json')
    with open(json_file, 'rt') as json_in:
        local_config = json.load(json_in)
        
    app.run(host=local_config['serverHost'],\
        port=local_config['port'],\
        debug=False,\
        use_reloader=False)