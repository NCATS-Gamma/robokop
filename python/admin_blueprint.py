'''
Blueprint for /admin/* pages
'''

from flask import Blueprint, jsonify, render_template, request, Flask, url_for, redirect
from datetime import datetime
from util import getAuthData
from user import User, Role, list_users
from question import list_questions
from answer import list_answersets

admin = Blueprint('admin', __name__,
              template_folder='templates')

################################################################################
##### Admin Interface ##########################################################
################################################################################
@admin.route('/')
def admin_page():
    """Deliver admin page"""
    user = getAuthData()

    if user['is_admin']:
        return render_template('admin.html')
    else:
        return redirect(url_for('security.login', next=request.url))

@admin.route('/data', methods=['GET'])
def admin_data():
    """Data for admin display """

    user = getAuthData()

    if not user['is_admin']:
        return redirect(url_for('security.login', next='/admin'))
    else:
        now_str = datetime.now().__str__()
        users = [u.toJSON() for u in list_users()]
        questions = [q.toJSON() for q in list_questions()]
        answersets = [aset.toJSON() for aset in list_answersets()]

        return jsonify({'timestamp': now_str,\
            'users': users,\
            'questions': questions,\
            'answersets': answersets})

@admin.route('/q/delete', methods=['POST'])
def admin_question_delete():
    """Delete question (if current_user is admin)"""

@admin.route('/q/edit', methods=['POST'])
def admin_question_edit():
    """Edit question (if current_user is admin)"""

@admin.route('/u/delete', methods=['POST'])
def admin_user_delete():
    """Delete user (if current_user is admin)"""

@admin.route('/u/edit', methods=['POST'])
def admin_user_edit():
    """Delete Edit (if current_user is admin)"""

@admin.route('/a/delete', methods=['POST'])
def admin_answerset_delete():
    """Delete Answerset (if current_user is admin)"""