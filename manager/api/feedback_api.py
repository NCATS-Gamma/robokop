'''
Blueprint for /api/feedback endpoints
'''

from flask import request
from flask_security import auth_required, current_user
from flask_restful import Resource

from manager.feedback import Feedback
from manager.setup import api
from manager.user import get_user_by_email

# New Feedback Submission
class FeedbackAPI(Resource):
    @auth_required('session', 'basic')
    def post(self):
        """Create new feedback
        ---
        tags: [feedback]
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

        auth = request.authorization
        if auth:
            user_email = auth.username
            user = get_user_by_email(user_email)
            user_id = user.id
        else:
            user_id = current_user.id
        f = Feedback(
            user_id=user_id,
            question_id=request.json['question_id'],
            answer_id=request.json['answer_id'],
            accuracy=request.json['accuracy'],
            impact=request.json['impact'],
            notes=request.json['notes'])

        return "Feedback created", 201

api.add_resource(FeedbackAPI, '/feedback/')
