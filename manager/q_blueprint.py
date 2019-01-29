"""Blueprint for /q/* pages."""

from flask import Blueprint, render_template, request
from flask_security import auth_required


q = Blueprint('question', __name__,
              template_folder='templates')


# New Question Interface
@q.route('/new/', methods=['GET'])
def new():
    """Deliver new-question interface."""
    return render_template('questionNew.html', question_id='')


@q.route('/new/linear/', methods=['GET'])
def newLinear():
    """Deliver new-question linear interface."""
    return render_template('questionNewLinear.html', question_id='')


# New Question Submission
@q.route('/new/', methods=['POST'])
@auth_required('session', 'basic')
def new_from_post():
    """Trigger creation of a new question, or prepopulate question new page."""
    # If you make a post request with a question_id we will assume you want a new question editor
    # we will prepopulate the question new page with data from that question (if it is a valid question id)
    question_id = request.form['question_id'] if request.form['question_id'] else ''

    return render_template('questionNew.html', question_id=question_id)


# Question
@q.route('/<question_id>/', methods=['GET'])
def question_page(question_id):
    """Deliver user info page."""
    return render_template('question.html', question_id=question_id)
