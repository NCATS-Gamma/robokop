#!/usr/bin/env python

"""Flask web server thread"""

import os
import re
import json

import redis
from flask import render_template
from flask_security import Security, SQLAlchemySessionUserDatastore

from manager.setup import app, db
import deploy.initialize_manager
import manager.api.graphql
from manager.logging_config import logger
from manager.user import User, Role
from manager.questions_blueprint import questions
from manager.q_blueprint import q
from manager.a_blueprint import a
from manager.util import getAuthData
import manager.tasks  # set up rabbitmq exchange/queues

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
