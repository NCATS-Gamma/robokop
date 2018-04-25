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
from feedback import list_feedback_by_answer
from logging_config import logger

a = Blueprint('answer', __name__,
              template_folder='templates')

# Answer Set
@a.route('/<qa_id>')
def answerset(qa_id):
    """Deliver answerset page for a given id"""
    question_id, answerset_id = qa_id.split('_')
    return render_template('answerset.html', question_id=question_id, answerset_id=answerset_id)

# Answer
@a.route('/<qa_id>/<answer_id>')
def answer(question_id, answerset_id, answer_id):
    """Deliver answerset page for a given id"""
    return render_template('answer.html', question_id=question_id, answerset_id=answerset_id, answer_id=answer_id)