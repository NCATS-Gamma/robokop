'''
Blueprint for /q/* pages
'''

import random
import string
import os
import sys
import re
from datetime import datetime
from flask import Blueprint, jsonify, render_template, request
from flask_security import auth_required
from flask_security.core import current_user

from question import Question, get_question_by_id
from answer import list_answersets_by_question_hash
from tasks import initialize_question, answer_question, update_kg
from util import getAuthData, get_tasks
from setup import db
from logging_config import logger

greent_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-interfaces')
sys.path.insert(0, greent_path)
from greent import node_types

q = Blueprint('question', __name__,
              template_folder='templates')

# New Question Interface
@q.route('/new', methods=['GET'])
def new():
    """Deliver new-question interface"""
    return render_template('questionNew.html', question_id=None)

# New Question Submission
@q.route('/new', methods=['POST'])
@auth_required('session', 'basic')
def new_from_post():
    """Trigger creation of a new question, or prepopulate question new page"""
    # If you make a post request with a question_id we will assume you want a new question editor
    # we will prepopulate the question new page with data from that question (if it is a valid question id)
    return render_template('questionNew.html', question_id=request.form['question_id'])

@q.route('/new/data', methods=['GET', 'POST'])
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

# Question
@q.route('/<question_id>', methods=['GET'])
def question_page(question_id):
    """Deliver user info page"""
    return render_template('question.html', question_id=question_id)

################################################################################
##### New Question #############################################################
################################################################################
@q.route('/new/search', methods=['POST'])
def question_new_search():
    """Validate/provide suggestions for a search term"""

@q.route('/new/validate', methods=['POST'])
def question_new_validate():
    """Validate a machine question to ensure it could possibly be executed"""

@q.route('/new/translate', methods=['POST'])
def question_new_translate():
    """Translate a natural language question into a machine question"""
