#!/usr/bin/env python

"""Start Flask web server."""

import os

from flask import render_template

from manager.setup import app
import initialize_manager
import manager.logging_config
from manager.questions_blueprint import questions
from manager.q_blueprint import q
from manager.a_blueprint import a

# set up all apis
import manager.api.messages_api
import manager.api.q_api
import manager.api.feedback_api
import manager.api.misc_api
import manager.api.simple_api
import manager.api.flowbokop_api


# Initialization
@app.before_first_request
def init():
    """Initialize Flask app."""
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


@app.route('/search/')
def search():
    """Search for biomedical concept identifiers"""
    return render_template('search.html')


@app.route('/flowbokop/')
def flowbokop():
    """Flowbokop UI."""
    return render_template('flowbokop.html')


@app.route('/simple/')
def simple():
    """Simple Interface"""
    return render_template('simple.html')


@app.route('/app/answerset/')
def app_answerset():
    """Answerset Browser with upload"""
    return render_template('app_answerset.html')


@app.route('/app/answerset-message/')
def app_answerset_msg():
    """Answerset Browser with upload for new message format"""
    return render_template('app_msg_answerset.html')


@app.route('/app/comparison/')
def app_comparison():
    """Template COP Comparison"""
    return render_template('app_comparison.html')

# Run Webserver
if __name__ == '__main__':

    # Get host and port from environmental variables
    server_host = '0.0.0.0'
    server_port = int(os.environ['MANAGER_PORT'])

    app.run(
        host=server_host,
        port=server_port,
        debug=True,
        use_reloader=True
    )
