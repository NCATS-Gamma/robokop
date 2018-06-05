#!/usr/bin/env python

"""Flask web server thread"""

import os
import re

from flask import render_template
from flask_security import Security, SQLAlchemySessionUserDatastore

from manager.setup import app, db
from manager.logging_config import logger
from manager.user import User, Role
from manager.questions_blueprint import questions
from manager.q_blueprint import q
from manager.a_blueprint import a
from manager.util import get_tasks, getAuthData

import manager.api.misc_api

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

@app.route('/')
def landing():
    """Initial contact. Give the initial page."""
    return render_template('landing.html')

@app.route('/start/')
def start():
    """Getting started guide"""
    return render_template('start.html')

@app.route('/workflow/')
def workflow():
    """Workflow UI."""
    return render_template('workflow.html')

@app.route('/app/answerset/')
def app_answerset():
    """Answerset Browser with upload"""
    return render_template('app_answerset.html')

@app.route('/app/comparison/')
def app_comparison():
    """Template COP Comparison"""
    return render_template('app_comparison.html')
    
# from celery.app.control import Inspect
@app.route('/tasks/')
def show_tasks():
    """Fetch queued/active task list"""
    tasks = get_tasks()
    output = []
    output.append('{:<40}{:<30}{:<40}{:<20}{:<20}'.format('task id', 'name', 'question hash', 'user', 'state'))
    output.append('-'*150)
    for task_id in tasks:
        task = tasks[task_id]
        name = task['name'] if task['name'] else ''
        question_hash = re.match(r"\['(.*)'\]", task['args']).group(1) if task['args'] else ''
        # question_id = re.search(r"'question_id': '(\w*)'", task['kwargs']).group(1) if task['kwargs'] and not task['kwargs'] == '{}' else ''
        user_email = re.search(r"'user_email': '([\w@.]*)'", task['kwargs']).group(1) if task['kwargs'] and not task['kwargs'] == '{}' else ''
        state = task['state'] if task['state'] else ''
        output.append('{:<40}{:<30}{:<40}{:<20}{:<20}'.format(task_id, name, question_hash, user_email, state))

    return "<pre>"+"\n".join(output)+"</pre>"

################################################################################
##### Run Webserver ############################################################
################################################################################

if __name__ == '__main__':

    # Get host and port from environmental variables
    server_host = '0.0.0.0' #os.environ['ROBOKOP_HOST']
    server_port = int(os.environ['MANAGER_PORT'])

    app.run(host=server_host,\
        port=server_port,\
        debug=True,\
        use_reloader=True)
