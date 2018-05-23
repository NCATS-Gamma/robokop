'''
Blueprint for /a/* pages
'''

from datetime import datetime
from flask import jsonify
from flask_restplus import Resource

from manager.question import get_question_by_id, list_questions_by_hash
from manager.answer import list_answersets_by_question_hash, get_answer_by_id, get_answerset_by_id, list_answers_by_answerset
from manager.util import getAuthData
from manager.feedback import list_feedback_by_question_answer, list_feedback_by_question_answerset
from manager.logging_config import logger
from manager.setup import app, api

@api.route('/a/<qa_id>')
@api.param('qa_id', 'An answerset id, prefixed by the question hash, i.e. "<question_id>_<answerset_id>"')
class AnswersetAPI(Resource):
    @api.response(200, 'Success')
    @api.response(404, 'Invalid answerset key')
    def get(self, qa_id):
        """Get answerset 
        ---
        parameters:
          - in: xxx
            name: xxx
            description: xxx
            schema:
                $ref: '#/xxx'
            required: xxx
        responses:
            200:
                description: xxx
                schema:
                    type: xxx
                    required:
                      - xxx
                    properties:
                        xxx
                            type: xxx
                            description: xxx
        """
        # replace `parameters` with this when OAS 3.0 is fully supported by Swagger UI
        # https://github.com/swagger-api/swagger-ui/issues/3641
        """
        requestBody:
            description: xxx
            required: xxx
            content:
                application/json:
                    schema:
                        $ref: '#/xxx'
        """
        try:
            question_id, answerset_id = qa_id.split('_')
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

        feedback = list_feedback_by_question_answerset(question, answerset)

        return {'user': user,\
                'question': question.toJSON(),\
                'answerset': answerset.toStandard(),\
                'feedback': [f.toJSON() for f in feedback],\
                'other_answersets': [aset.toStandard(data=False) for aset in answersets],
                'other_questions': [q.toJSON() for q in questions]}, 200

@api.route('/a/<qa_id>/<int:answer_id>')
@api.param('qa_id', 'An answerset id, prefixed by the question hash, i.e. "<question_id>_<answerset_id>"')
@api.param('answer_id', 'An answer id')
class AnswerAPI(Resource):
    @api.response(200, 'Success')
    @api.response(404, 'Invalid answerset or answer key')
    def get(self, qa_id, answer_id):
        """Get answer
        ---
        parameters:
          - in: xxx
            name: xxx
            description: xxx
            schema:
                $ref: '#/xxx'
            required: xxx
        responses:
            200:
                description: xxx
                schema:
                    type: xxx
                    required:
                      - xxx
                    properties:
                        xxx
                            type: xxx
                            description: xxx
        """
        # replace `parameters` with this when OAS 3.0 is fully supported by Swagger UI
        # https://github.com/swagger-api/swagger-ui/issues/3641
        """
        requestBody:
            description: xxx
            required: xxx
            content:
                application/json:
                    schema:
                        $ref: '#/xxx'
        """

        try:
            question_id, answerset_id = qa_id.split('_')
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
        idx = questions.index(question)
        questions.pop(idx)
        idx = answersets.index(answerset)
        answersets.pop(idx)

        feedback = list_feedback_by_question_answer(question, answer)

        user = getAuthData()

        return {'user': user,\
                'answerset': answerset.toJSON(),\
                'answer': answer.toJSON(),\
                'feedback': [f.toJSON() for f in feedback],\
                'question': question.toJSON(),\
                'other_answersets': [aset.toJSON() for aset in answersets],
                'other_questions': [q.toJSON() for q in questions]}, 200

# get feedback by question-answer
@api.route('/a/<qa_id>/<int:answer_id>/feedback')
class GetFeedbackByAnswer(Resource):
    @api.response(200, 'Success')
    @api.doc(params={
        'qa_id': 'An answerset id, prefixed by the question hash, i.e. "<question_id>_<answerset_id>"',
        'answer_id': 'Answer id'})
    def get(self, qa_id, answer_id):
        """Create new feedback
        ---
        parameters:
          - in: xxx
            name: xxx
            description: xxx
            schema:
                $ref: '#/xxx'
            required: xxx
        responses:
            200:
                description: xxx
                schema:
                    type: xxx
                    required:
                      - xxx
                    properties:
                        xxx
                            type: xxx
                            description: xxx
        """
        # replace `parameters` with this when OAS 3.0 is fully supported by Swagger UI
        # https://github.com/swagger-api/swagger-ui/issues/3641
        """
        requestBody:
            description: xxx
            required: xxx
            content:
                application/json:
                    schema:
                        $ref: '#/xxx'
        """
        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id)
            answerset = get_answerset_by_id(answerset_id)
            answer = get_answer_by_id(answer_id)
            feedback = list_feedback_by_question_answer(question, answer)
        except Exception as err:
            return "Invalid answerset/answer key", 404

        return [f.toJSON() for f in feedback], 200

# get feedback by question-answerset
@api.route('/a/<qa_id>/feedback')
class GetFeedbackByAnswerset(Resource):
    @api.response(200, 'Success')
    @api.doc(params={
        'qa_id': 'An answerset id, prefixed by the question hash, i.e. "<question_id>_<answerset_id>"'})
    def get(self, qa_id):
        """Create new feedback
        ---
        parameters:
          - in: xxx
            name: xxx
            description: xxx
            schema:
                $ref: '#/xxx'
            required: xxx
        responses:
            200:
                description: xxx
                schema:
                    type: xxx
                    required:
                      - xxx
                    properties:
                        xxx
                            type: xxx
                            description: xxx
        """
        # replace `parameters` with this when OAS 3.0 is fully supported by Swagger UI
        # https://github.com/swagger-api/swagger-ui/issues/3641
        """
        requestBody:
            description: xxx
            required: xxx
            content:
                application/json:
                    schema:
                        $ref: '#/xxx'
        """
        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id)
            answerset = get_answerset_by_id(answerset_id)
            feedback = list_feedback_by_question_answerset(question, answerset)
        except Exception as err:
            return "Invalid answerset key", 404

        return [f.toJSON() for f in feedback], 200
