'''
Blueprint for /a/* pages
'''

from datetime import datetime
from flask import jsonify
from flask_restplus import Resource

from question import get_question_by_id, list_questions_by_hash
from answer import list_answersets_by_question_hash, get_answer_by_id, get_answerset_by_id, list_answers_by_answerset
from util import getAuthData, QAConverter

from feedback import list_feedback_by_answer
from logging_config import logger
from setup import app, api

app.url_map.converters['qa'] = QAConverter

@api.route('/a/<qa:qa_id>')
@api.param('qa_id', 'An answerset id, prefixed by the question hash, i.e. "<question_id>_<answerset_id>"')
class AnswersetAPI(Resource):
    @api.response(200, 'Success')
    @api.response(404, 'Invalid answerset key')
    def get(self, qa_id):
        """Get answerset """
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

        return {'user': user,\
                'question': question.toJSON(),\
                'answerset': answerset.toJSON(),\
                'answers': [a.toJSON() for a in answers],\
                'other_answersets': [aset.toJSON() for aset in answersets],
                'other_questions': [q.toJSON() for q in questions],\
                'answerset_graph': answerset_graph}, 200

@api.route('/a/<qa:qa_id>/<int:answer_id>')
@api.param('qa_id', 'An answerset id, prefixed by the question hash, i.e. "<question_id>_<answerset_id>"')
@api.param('answer_id', 'An answer id')
class AnswerAPI(Resource):
    @api.response(200, 'Success')
    @api.response(404, 'Invalid answerset or answer key')
    def get(self, qa_id, answer_id):
        """Get answer"""

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

        return {'user': user,\
                'answerset': answerset.toJSON(),\
                'answer': answer.toJSON(),\
                'questions': [q.toJSON() for q in questions],\
                'feedback': feedback}, 200
