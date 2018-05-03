'''
Blueprint for /a/* pages
'''

import os
import sys
from datetime import datetime
from flask import Blueprint, jsonify, render_template

from question import get_question_by_id, list_questions_by_hash
from answer import list_answersets_by_question_hash, get_answer_by_id, get_answerset_by_id, list_answers_by_answerset
from util import getAuthData
from logging_config import logger

a = Blueprint('answer', __name__,
              template_folder='templates')

# Answer Set
@a.route('/<answerset_id>')
def answerset(answerset_id):
    """Deliver answerset page for a given id"""
    return render_template('answerset.html', answerset_id=answerset_id, answer_id=[])

# Answer
@a.route('/<answerset_id>/<answer_id>')
def answer(answerset_id, answer_id):
    """Deliver answerset page for a given id, set to particular answer"""
    return render_template('answerset.html', answerset_id=answerset_id, answer_id=answer_id)
