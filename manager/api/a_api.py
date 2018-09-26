'''
Blueprint for /a/* pages
'''

from datetime import datetime
from flask import jsonify
from flask_restful import Resource

from manager.question import get_question_by_id
from manager.answer import get_answer_by_id, get_answerset_by_id
from manager.util import getAuthData
from manager.feedback import list_feedback_by_question_answer, list_feedback_by_question_answerset
from manager.logging_config import logger
from manager.setup import app, api, db

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
            schema:
                type: string
            required: true
        responses:
            200:
                description: "answerset data"
                content:
                    application/json:
                        schema:
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
                content:
                    text/plain:
                        type: string
        """
        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id, session=db.session)
            answerset = get_answerset_by_id(answerset_id, session=db.session)
            answersets = question.answersets
            if not answerset in answersets:
                raise AssertionError()
        except Exception as err:
            return "Invalid answerset key.", 404

        user = getAuthData()

        feedback = list_feedback_by_question_answerset(question, answerset, session=db.session)

        return {'question': question.to_json(),\
                'answerset': answerset.toStandard(),\
                'feedback': [f.to_json() for f in feedback],\
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
            schema:
                type: string
            required: true
          - in: path
            name: answer_id
            description: "answer/result id"
            schema:
                type: string
            required: true
        responses:
            200:
                description: "answer data"
                content:
                    application/json:
                        schema:
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
                content:
                    text/plain:
                        type: string
        """

        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id, session=db.session)
            answerset = get_answerset_by_id(answerset_id, session=db.session)
            answersets = question.answersets
            if not answerset in answersets:
                raise AssertionError()
            answer = get_answer_by_id(answer_id, session=db.session)
            if not answer in answerset.answers:
                raise AssertionError()
        except Exception as err:
            return "Invalid answerset or answer key.", 404

        feedback = list_feedback_by_question_answer(question, answer, session=db.session)

        user = getAuthData()

        return {'user': user,\
                'answerset': answerset.to_json(),\
                'answer': answer.to_json(),\
                'feedback': [f.to_json() for f in feedback],\
                'question': question.to_json(),\
                'other_answersets': [],
                'other_questions': []}, 200

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
            schema:
                type: string
            required: true
          - in: path
            name: answer_id
            description: "answer/result id"
            schema:
                type: string
            required: true
        responses:
            200:
                description: "answer feedback"
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                $ref: '#/definitions/Feedback'
            404:
                description: "invalid answerset/answer id"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id, session=db.session)
            answerset = get_answerset_by_id(answerset_id, session=db.session)
            answer = get_answer_by_id(answer_id, session=db.session)
        except Exception as err:
            return "Invalid answerset/answer key", 404
        feedback = list_feedback_by_question_answer(question, answer, session=db.session)

        return [f.to_json() for f in feedback], 200

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
            schema:
                type: string
            required: true
        responses:
            200:
                description: "answer feedback"
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                $ref: '#/definitions/Feedback'
            404:
                description: "invalid answerset/answer id"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        try:
            question_id, answerset_id = qa_id.split('_')
            question = get_question_by_id(question_id, session=db.session)
            answerset = get_answerset_by_id(answerset_id, session=db.session)
        except Exception as err:
            return "Invalid answerset key", 404
        feedback = list_feedback_by_question_answerset(question, answerset, session=db.session)

        return [f.to_json() for f in feedback], 200

api.add_resource(GetFeedbackByAnswerset, '/a/<qa_id>/feedback/')
