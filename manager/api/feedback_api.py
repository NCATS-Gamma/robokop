'''
Blueprint for /api/feedback endpoints
'''

from flask import request
from flask_security import auth_required, current_user
from flask_restplus import Resource

from manager.feedback import Feedback
from manager.setup import api

# New Feedback Submission
@api.route('/feedback/')
class FeedbackAPI(Resource):
    @auth_required('session', 'basic')
    @api.response(201, 'Question created')
    @api.doc(params={
        'question_id': 'Question id',
        'answer_id': 'Answer id',
        'accuracy': 'Accuracy',
        'impact': 'Impact',
        'notes': 'Notes'})
    def post(self):
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
        f = Feedback(
            user_id=current_user.id,
            question_id=request.json['question_id'],
            answer_id=request.json['answer_id'],
            accuracy=request.json['accuracy'],
            impact=request.json['impact'],
            notes=request.json['notes'])

        return "Feedback created", 201
