'''
Blueprint for /api/q/* endpoints
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

q_api = Blueprint('q_api', __name__,
              template_folder='templates')

@q_api.route('/<question_id>/answer', methods=['POST'])
@auth_required('session', 'basic')
def question_answer(question_id):
    """ run update or answer actions """
    question_hash = get_question_by_id(question_id).hash
    username = current_user.username
    # Answer a question
    task = answer_question.apply_async(args=[question_hash], kwargs={'question_id':question_id, 'user_email':username})
    return jsonify({'task_id':task.id}), 202

@q_api.route('/<question_id>/refresh_kg', methods=['POST'])
@auth_required('session', 'basic')
def question_refresh_kg(question_id):
    """ run update or answer actions """
    question_hash = get_question_by_id(question_id).hash
    username = current_user.username
    # Update the knowledge graph for a question
    task = update_kg.apply_async(args=[question_hash], kwargs={'question_id':question_id, 'user_email':username})
    return jsonify({'task_id':task.id}), 202

@q_api.route('/<question_id>', methods=['POST'])
@auth_required('session', 'basic')
def question_edit(question_id):
    """Edit the properties of a question"""
    logger.info('Editing question %s', question_id)
    q = get_question_by_id(question_id)
    if not (current_user == q.user or current_user.has_role('admin')):
        return "UNAUTHORIZED", 401 # not authorized
    q.name = request.json['name']
    q.notes = request.json['notes']
    q.natural_question = request.json['natural_question']
    db.session.commit()
    return "SUCCESS", 200

@q_api.route('/<question_id>', methods=['DELETE'])
@auth_required('session', 'basic')
def question_delete(question_id):
    """Delete question (if owned by current_user)"""
    logger.info('Deleting question %s', question_id)
    q = get_question_by_id(question_id)
    if not (current_user == q.user or current_user.has_role('admin')):
        return "UNAUTHORIZED", 401 # not authorized
    db.session.delete(q)
    db.session.commit()
    return "SUCCESS", 200

@q_api.route('/<question_id>', methods=['GET'])
def question_data(question_id):
    """Data for a question"""

    user = getAuthData()

    question = get_question_by_id(question_id)
    answerset_list = list_answersets_by_question_hash(question.hash)

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,
                    'user': user,
                    'question': question.toJSON(),
                    'owner': question.user.email,
                    'answerset_list': [a.toJSON() for a in answerset_list]})

@q_api.route('/<question_id>/tasks', methods=['GET'])
def question_tasks(question_id):
    """ List of active and queued tasks for only a specific question """

    question_hash = get_question_by_id(question_id).hash

    tasks = get_tasks().values()

    # filter out tasks for other questions
    tasks = [t for t in tasks if (re.match("\['(.*)'\]", t['args']).group(1) if t['args'] else None) == question_hash]

    # filter out the SUCCESS/FAILURE tasks
    tasks = [t for t in tasks if not (t['state'] == 'SUCCESS' or t['state'] == 'FAILURE')]

    # split into answer and update tasks
    answerers = [t for t in tasks if t['name'] == 'tasks.answer_question']
    updaters = [t for t in tasks if t['name'] == 'tasks.update_kg']
    initializers = [t for t in tasks if t['name'] == 'tasks.initialize_question']

    return jsonify({'answerers': answerers,
                    'updaters': updaters,
                    'initializers': initializers})

@q_api.route('/<question_id>/subgraph', methods=['GET'])
def question_subgraph(question_id):
    """Data for a question"""

    question = get_question_by_id(question_id)
    subgraph = question.relevant_subgraph()

    return jsonify(subgraph)
