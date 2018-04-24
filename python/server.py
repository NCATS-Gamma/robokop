#!/usr/bin/env python

"""Flask web server thread"""

import os
import json
import re
import sys
import requests
from datetime import datetime

from flask import Flask, jsonify, request, render_template, url_for, redirect
from flask_security import Security, SQLAlchemySessionUserDatastore, auth_required
from flask_security.core import current_user
from flask_login import LoginManager, login_required

from setup import app, db
from logging_config import logger
from user import User, Role, list_users
from question import list_questions
from answer import list_answersets
from questions_blueprint import questions
from q_blueprint import q
from a_blueprint import a
from util import get_tasks, getAuthData

# Setup flask-security with user tables
user_datastore = SQLAlchemySessionUserDatastore(db.session, User, Role)
security = Security(app, user_datastore)

# Initialization
@app.before_first_request
def init():
    pass

app.register_blueprint(questions, url_prefix='/questions')
app.register_blueprint(q, url_prefix='/q')
app.register_blueprint(a, url_prefix='/a')

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

@app.route('/status/<task_id>')
def taskstatus(task_id):
    # task = celery.AsyncResult(task_id)
    # return task.state

    flower_url = f'http://{os.environ["FLOWER_ADDRESS"]}:{os.environ["FLOWER_PORT"]}/api/task/result/{task_id}'
    response = requests.get(flower_url, auth=(os.environ['FLOWER_USER'], os.environ['FLOWER_PASSWORD']))
    return json.dumps(response.json())

# from celery.app.control import Inspect
@app.route('/tasks')
def show_tasks():
    """Fetch queued/active task list"""
    tasks = get_tasks()
    output = []
    output.append('{:<40}{:<30}{:<40}{:<20}{:<20}'.format('task id', 'name', 'question hash', 'user', 'state'))
    output.append('-'*150)
    print(tasks)
    for task_id in tasks:
        task = tasks[task_id]
        name = task['name'] if task['name'] else ''
        question_hash = re.match("\['(.*)'\]", task['args']).group(1) if task['args'] else ''
        question_id = re.search("'question_id': '(\w*)'", task['kwargs']).group(1) if task['kwargs'] and not task['kwargs'] == '{}' else ''
        user_email = re.search("'user_email': '([\w@.]*)'", task['kwargs']).group(1) if task['kwargs'] and not task['kwargs'] == '{}' else ''
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