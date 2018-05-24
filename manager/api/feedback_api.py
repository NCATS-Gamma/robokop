'''
Blueprint for /api/feedback endpoints
'''

from flask import request
from flask_security import auth_required, current_user
from flask_restplus import Resource

from manager.feedback import Feedback
from manager.setup import api

# New Feedback Submission
class FeedbackAPI(Resource):
    @auth_required('session', 'basic')
    def post(self):
        """Create new feedback
        ---
        parameters:
          - in: body
            name: feedback
            description: "new feedback"
            schema:
                $ref: '#/definitions/Feedback'
        responses:
            201:
                description: "confirmation"
                type: string
        """
        f = Feedback(
            user_id=current_user.id,
            question_id=request.json['question_id'],
            answer_id=request.json['answer_id'],
            accuracy=request.json['accuracy'],
            impact=request.json['impact'],
            notes=request.json['notes'])

        return "Feedback created", 201

api.add_resource(FeedbackAPI, '/feedback/')
