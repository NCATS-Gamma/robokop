'''
Blueprint for /q/* pages
'''

import random
import string
import os
import sys
import re
import requests
from datetime import datetime
from flask import Blueprint, jsonify, render_template, request
from flask_security import auth_required
from flask_security.core import current_user

from manager.question import Question, get_question_by_id
from manager.tasks import answer_question, update_kg
from manager.util import getAuthData
from manager.setup import db
from manager.logging_config import logger

q = Blueprint('question', __name__,
              template_folder='templates')

# New Question Interface
@q.route('/new/', methods=['GET'])
def new():
    """Deliver new-question interface"""
    return render_template('questionNew.html', question_id='')

@q.route('/new/linear/', methods=['GET'])
def newLinear():
    """Deliver new-question linear interface"""
    return render_template('questionNewLinear.html', question_id='')

# New Question Submission
@q.route('/new/', methods=['POST'])
@auth_required('session', 'basic')
def new_from_post():
    """Trigger creation of a new question, or prepopulate question new page"""
    # If you make a post request with a question_id we will assume you want a new question editor
    # we will prepopulate the question new page with data from that question (if it is a valid question id)
    question_id = request.form['question_id'] if request.form['question_id'] else ''

    return render_template('questionNew.html', question_id=question_id)

# Question
@q.route('/<question_id>/', methods=['GET'])
def question_page(question_id):
    """Deliver user info page"""
    return render_template('question.html', question_id=question_id)

################################################################################
##### New Question #############################################################
################################################################################
@q.route('/new/search/', methods=['POST'])
def question_new_search():
    """Validate/provide suggestions for a search term"""

@q.route('/new/validate/', methods=['POST'])
def question_new_validate():
    """Validate a machine question to ensure it could possibly be executed"""

@q.route('/new/translate/', methods=['POST'])
def question_new_translate():
    """Translate a natural language question into a machine question"""
