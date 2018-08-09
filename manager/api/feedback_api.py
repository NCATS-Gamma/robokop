'''
Blueprint for /api/feedback endpoints
'''

from flask import request
from flask_security import auth_required, current_user
from flask_restful import Resource

from manager.feedback import Feedback, list_feedback_by_question_answer
from manager.setup import api, db
from manager.user import get_user_by_email, get_user_by_id
from manager.answer import get_answer_by_id
from manager.question import get_question_by_id

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
            user = get_user_by_email(user_email, session=db.session)
            user_id = user.id
        else:
            user_id = current_user.id
            user = get_user_by_id(user_id, session=db.session)
        
        answer = get_answer_by_id(request.json['answer_id'], session=db.session)
        question = get_question_by_id(request.json['question_id'], session=db.session)
        feedback = list_feedback_by_question_answer(question, answer, session=db.session)
        user_ids = [f.user_id for f in feedback]
        if user_id in user_ids:
            f = feedback[user_ids.index(user_id)]
            f.accuracy = request.json['accuracy']
            f.impact = request.json['impact']
            f.notes = request.json['notes']
            db.session.commit()
        else:
            f = Feedback(
                user_id=user_id,
                question_id=request.json['question_id'],
                answer_id=request.json['answer_id'],
                accuracy=request.json['accuracy'],
                impact=request.json['impact'],
                notes=request.json['notes'])
            db.session.add(f)
            db.session.commit()

        return "Feedback created", 201

api.add_resource(FeedbackAPI, '/feedback/')
