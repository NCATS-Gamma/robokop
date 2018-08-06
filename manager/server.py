#!/usr/bin/env python

"""Flask web server thread"""

import os
import re
import json

import redis
from flask import render_template
from flask_security import Security, SQLAlchemySessionUserDatastore

from manager.setup import app, db
import manager.api.graphql
from manager.logging_config import logger
from manager.user import User, Role
from manager.questions_blueprint import questions
from manager.q_blueprint import q
from manager.a_blueprint import a
from manager.util import getAuthData

import manager.api.misc_api

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

@app.route('/about/')
def start():
    """Getting started guide"""
    return render_template('about.html')

@app.route('/activity/')
def activity():
    """List of tasks."""
    return render_template('activity.html')

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
    r = redis.Redis(
        host=os.environ['RESULTS_HOST'],
        port=os.environ['RESULTS_PORT'],
        db=os.environ['MANAGER_RESULTS_DB'])

    output = []
    output.append("""
    <style>
    table, th, td {
        border: 1px solid black
    }
    </style>
    """)
    output.append(f"<tr><th>task id</th><th>name</th><th>user</th><th>state</th><th /></tr>")
    for name in r.scan_iter('*'):
        name = name.decode() # convert bytes to str
        task = json.loads(r.get(name))
        # name = task['name'] or '' if 'name' in task else ''
        task_id = task['task_id']
        # question_id = re.search(r"'question_id': '(\w*)'", task['kwargs']).group(1) if task['kwargs'] and not task['kwargs'] == '{}' else ''
        # user_email = re.search(r"'user_email': '([\w@.]*)'", task['kwargs']).group(1) if task['kwargs'] and not task['kwargs'] == '{}' else ''
        user_email = ''
        state = task['status'] or ''

        output.append(f"<tr><td>{task_id}</td><td>{name}</td><td>{user_email}</td><td>{state}</td><td><a>revoke</a></td></tr>")

    return "<table>\n"+"\n".join(output)+"\n</table>"

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
