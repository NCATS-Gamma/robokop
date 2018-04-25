'''
Blueprint for /a/* pages
'''

from datetime import datetime
from flask import Blueprint, jsonify

from question import get_question_by_id, list_questions_by_hash
from answer import list_answersets_by_question_hash, get_answer_by_id, get_answerset_by_id, list_answers_by_answerset
from util import getAuthData, QAConverter

from feedback import list_feedback_by_answer
from logging_config import logger
from setup import app

a_api = Blueprint('answer_api', __name__,
                  template_folder='templates')
app.url_map.converters['qa'] = QAConverter

@a_api.route('/<qa:qa_id>', methods=['GET'])
def answerset_data(qa_id):
    """Data for an answerset """
    try:
        question_id, answerset_id = qa_id
        question = get_question_by_id(question_id)
        answerset = get_answerset_by_id(answerset_id)
        answersets = list_answersets_by_question_hash(question.hash)
        if not answerset in answersets:
            raise AssertionError()
    except Exception as err:
        return "Invalid answerset key.", 404

    user = getAuthData()
    answers = list_answers_by_answerset(answerset)
    questions = list_questions_by_hash(answerset.question_hash)
    idx = questions.index(question)
    questions.pop(idx)
    idx = answersets.index(answerset)
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

@a_api.route('/<qa:qa_id>/<int:answer_id>', methods=['GET'])
def answer_data(qa_id, answer_id):
    """Data for an answer """

    try:
        question_id, answerset_id = qa_id
        question = get_question_by_id(question_id)
        answerset = get_answerset_by_id(answerset_id)
        answersets = list_answersets_by_question_hash(question.hash)
        if not answerset in answersets:
            raise AssertionError()
        answer = get_answer_by_id(answer_id)
        if not answer in answerset.answers:
            raise AssertionError()
    except Exception as err:
        return "Invalid answerset or answer key.", 404

    questions = list_questions_by_hash(answerset.question_hash)
    feedback = list_feedback_by_answer(answer)

    user = getAuthData()

    return jsonify({'user': user,\
        'answerset': answerset.toJSON(),\
        'answer': answer.toJSON(),\
        'questions': [q.toJSON() for q in questions],\
        'feedback': feedback})
