'''
Blueprint for /questions page
'''

from flask import Blueprint, render_template

questions = Blueprint('question_list', __name__,
                        template_folder='templates')

# QuestionList
@questions.route('/', methods=['GET'])
def questions_page():
    """Initial contact. Give the initial page."""
    return render_template('questions.html')
