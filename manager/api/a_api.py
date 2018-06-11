'''
Blueprint for /a/* pages
'''

from datetime import datetime
from flask import jsonify
from flask_restful import Resource

from manager.question import get_question_by_id
from manager.answer import get_answer_by_id, get_answerset_by_id, list_answers_by_answerset
from manager.util import getAuthData
from manager.feedback import list_feedback_by_question_answer, list_feedback_by_question_answerset
from manager.logging_config import logger
from manager.setup import app, api

class AnswersetAPI(Resource):
    def get(self, qa_id):
        """
        Get answerset 
        ---
        tags: [answer]
        parameters:
          - in: path
            name: qa_id
            description: "<question_id>_<answerset_id>"
            type: string
            required: true
        responses:
            200:
                description: "answerset data"
                type: object
                properties:
                    answerset:
                        schema:
                            $ref: '#/definitions/Response'
                    user:
                        type: object
                    question:
                        type: object
                    other_questions:
                        type: array
                        items:
                            type: object
                    other_answersets:
                        type: array
                        items:
                            type: object
                    feedback:
                        type: array
                        items:
                            type: object
            404:
                description: "invalid answerset id"
                type: string
        """
        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id)
            answerset = get_answerset_by_id(answerset_id)
            answersets = question.answersets
            if not answerset in answersets:
                raise AssertionError()
        except Exception as err:
            return "Invalid answerset key.", 404

        user = getAuthData()

        feedback = list_feedback_by_question_answerset(question, answerset)

        return {'question': question.toJSON(),\
                'answerset': answerset.toStandard(),\
                'feedback': [f.toJSON() for f in feedback],\
                'other_answersets': [],
                'other_questions': []}, 200

api.add_resource(AnswersetAPI, '/a/<qa_id>/')

class AnswerAPI(Resource):
    def get(self, qa_id, answer_id):
        """
        Get answer
        ---
        tags: [answer]
        parameters:
          - in: path
            name: qa_id
            description: "<question_id>_<answerset_id>"
            type: string
            required: true
          - in: path
            name: answer_id
            description: "answer/result id"
            type: string
            required: true
        responses:
            200:
                description: "answer data"
                type: object
                properties:
                    answer:
                        schema:
                            $ref: '#/definitions/Result'
                    answerset:
                        schema:
                            $ref: '#/definitions/Response'
                    user:
                        type: object
                    question:
                        type: object
                    other_questions:
                        type: array
                        items:
                            type: object
                    other_answersets:
                        type: array
                        items:
                            type: object
                    feedback:
                        type: array
                        items:
                            type: object
            404:
                description: "invalid answerset/answer id"
                type: string
        """

        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id)
            answerset = get_answerset_by_id(answerset_id)
            answersets = question.answersets
            if not answerset in answersets:
                raise AssertionError()
            answer = get_answer_by_id(answer_id)
            if not answer in answerset.answers:
                raise AssertionError()
        except Exception as err:
            return "Invalid answerset or answer key.", 404

        questions = answerset.questions
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

api.add_resource(AnswerAPI, '/a/<qa_id>/<int:answer_id>/')

# get feedback by question-answer
class GetFeedbackByAnswer(Resource):
    def get(self, qa_id, answer_id):
        """
        Get feedback by answer
        ---
        tags: [feedback]
        parameters:
          - in: path
            name: qa_id
            description: "<question_id>_<answerset_id>"
            type: string
            required: true
          - in: path
            name: answer_id
            description: "answer/result id"
            type: string
            required: true
        responses:
            200:
                description: "answer feedback"
                type: array
                items:
                    $ref: '#/definitions/Feedback'
            404:
                description: "invalid answerset/answer id"
                type: string
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

api.add_resource(GetFeedbackByAnswer, '/a/<qa_id>/<int:answer_id>/feedback/')

# get feedback by question-answerset
class GetFeedbackByAnswerset(Resource):
    def get(self, qa_id):
        """
        Get feedback by answerset
        ---
        tags: [feedback]
        parameters:
          - in: path
            name: qa_id
            description: "<question_id>_<answerset_id>"
            type: string
            required: true
        responses:
            200:
                description: "answer feedback"
                type: array
                items:
                    $ref: '#/definitions/Feedback'
            404:
                description: "invalid answerset/answer id"
                type: string
        """
        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id)
            answerset = get_answerset_by_id(answerset_id)
            feedback = list_feedback_by_question_answerset(question, answerset)
        except Exception as err:
            return "Invalid answerset key", 404

        return [f.toJSON() for f in feedback], 200

api.add_resource(GetFeedbackByAnswerset, '/a/<qa_id>/feedback/')
