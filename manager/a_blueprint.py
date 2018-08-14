'''
Blueprint for /a/* pages
'''

import os
import sys
from datetime import datetime
from flask import Blueprint, jsonify, render_template

from manager.question import get_question_by_id
from manager.util import getAuthData
from manager.logging_config import logger

a = Blueprint('answer', __name__,
              template_folder='templates')

# Answer Set
@a.route('/<answerset_id>/')
def answerset(answerset_id):
    """Deliver answerset page for a given id"""
    return render_template('answerset.html', answerset_id=answerset_id, answer_id=[])

# Answer
@a.route('/<answerset_id>/<answer_id>/')
def answer(answerset_id, answer_id):
    """Deliver answerset page for a given id, set to particular answer"""
    return render_template('answerset.html', answerset_id=answerset_id, answer_id=answer_id)
