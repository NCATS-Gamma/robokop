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

a_api = Blueprint('answer_api', __name__,
              template_folder='templates')

@a_api.route('/<qa_id>', methods=['GET'])
def answerset_data(qa_id):
    """Data for an answerset """
    question_id, answerset_id = qa_id.split('_')

    question = get_question_by_id(question_id)
    answersets = list_answersets_by_question_hash(question.hash)
    answerset_ids = [aset.id for aset in answersets]
    answerset_id = int(answerset_id)

    if not answerset_id in answerset_ids:
        return "Answerset not available for this question", 400 # bad request - question does not have this answerset

    user = getAuthData()
    answerset = get_answerset_by_id(answerset_id)
    answers = list_answers_by_answerset(answerset)
    questions = list_questions_by_hash(answerset.question_hash)
    idx = questions.index(question)
    questions.pop(idx)
    idx = answerset_ids.index(answerset_id)
    answersets.pop(idx)
    answerset_graph = None

    now_str = datetime.now().__str__()
    return jsonify({'timestamp': now_str,\
        'user': user,\
        'question': question.toJSON(),\
        'answerset': answerset.toJSON(),\
        'answers': [a.toJSON() for a in answers],\
        'other_answersets': [aset.toJSON() for aset in answersets],
        'other_questions': [q.toJSON() for q in questions],\
        'answerset_graph': answerset_graph})

@a_api.route('/<qa_id>/<answer_id>', methods=['GET'])
def answer_data(question_id, answerset_id, answer_id):
    """Data for an answer """
    
    user = getAuthData()
    if answerset_id == 'test':
        answer = get_answer_by_id(answer_id)
        answerset = get_answerset_by_id(answerset_id)
        questions = list_questions_by_hash(answerset.question_hash)
        feedback = list_feedback_by_answer(answer)
    else:
        answer = get_answer_by_id(answer_id)
        answerset = get_answerset_by_id(answerset_id)
        questions = list_questions_by_hash(answerset.question_hash)
        feedback = list_feedback_by_answer(answer)
    
    return jsonify({'user': user,\
        'answerset': answerset.toJSON(),\
        'answer': answer.toJSON(),\
        'questions': [q.toJSON() for q in questions],\
        'feedback': feedback})
