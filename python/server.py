"""Flask web server thread"""
import os
import json
import sqlite3
import subprocess
import logging
from datetime import datetime

from Question import Question
from KnowledgeGraph import KnowledgeGraph
from Storage import Storage

from flask import Flask, jsonify, request, render_template, url_for, redirect
from flask_security import Security, SQLAlchemySessionUserDatastore
from flask_mail import Mail
from flask_login import LoginManager, login_required
from flask_sqlalchemy import SQLAlchemy
from flask_security.core import current_user

from flask_security import UserMixin, RoleMixin
from sqlalchemy.orm import relationship, backref
from sqlalchemy import Boolean, DateTime, Column, Integer, \
                       String, ForeignKey

app = Flask(__name__, static_folder='../pack', template_folder='../templates')
# Set default static folder to point to parent static folder where all
# static assets can be stored and linked
app.config.from_pyfile('robokop-flask-config.py')

mail = Mail(app)
db = SQLAlchemy(app)
storage = Storage(db)

class RolesUsers(db.Model):
  __tablename__ = 'roles_users'
  id = Column(Integer, primary_key=True)
  user_id = Column('user_id', Integer, ForeignKey('user.id'))
  role_id = Column('role_id', Integer, ForeignKey('role.id'))

class Role(db.Model, RoleMixin):
  __tablename__ = 'role'
  id = Column(Integer, primary_key=True)
  name = Column(String, unique=True)
  description = Column(String)

class User(db.Model, UserMixin):
  __tablename__ = 'user'
  id = Column(Integer, primary_key=True)
  email = Column(String, unique=True)
  username = Column(String)
  password = Column(String)
  last_login_at = Column(DateTime)
  current_login_at = Column(DateTime)
  last_login_ip = Column(String)
  current_login_ip = Column(String)
  login_count = Column(Integer)
  active = Column(Boolean)
  confirmed_at = Column(DateTime)
  roles = relationship('Role', secondary='roles_users',
                        backref=backref('users', lazy='dynamic'))

# Setup flask-security with user tables
user_datastore = SQLAlchemySessionUserDatastore(db.session, User, Role)
security = Security(app, user_datastore)

# Create a user to test with
@app.before_first_request
def init():
  storage.boot(user_datastore)

# Flask Server code below
################################################################################

class InvalidUsage(Exception):
    """Error handler class to translate python exceptions to json messages"""
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    """Error handler to translate python exceptions to json messages"""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def getAuthData():
  """ Return relevant information from flask-login current_user"""
  # is_authenticated
  #   This property should return True if the user is authenticated, i.e. they have provided valid credentials. (Only authenticated users will fulfill the criteria of login_required.)
  # is_active
  #   This property should return True if this is an active user - in addition to being authenticated, they also have activated their account, not been suspended, or any condition your application has for rejecting an account. Inactive accounts may not log in (without being forced of course).
  # is_anonymous
  #   This property should return True if this is an anonymous user. (Actual users should return False instead.)

  is_authenticated = current_user.is_authenticated
  is_active = current_user.is_active
  is_anonymous = current_user.is_anonymous
  if is_anonymous:
    username = "Anonymous"
    is_admin = False
  else:
    username = current_user.username
    is_admin = current_user.has_role('admin')

  return {'is_authenticated': is_authenticated,\
          'is_active': is_active,\
          'is_anonymous': is_anonymous,\
          'is_admin': is_admin,\
          'username': username}

@app.route('/')
def landing():
  """Initial contact. Give the initial page."""
  return render_template('landing.html')

@app.route('/landing/data', methods=['GET'])
def landingData():
  """Data for the landing page."""

  user = getAuthData()

  now_str = datetime.now().__str__()
  return jsonify({'timestamp': now_str,\
    'user': user})

# Account information
@app.route('/account')
@login_required
def account():
  """Deliver user info page"""
  return render_template('account.html')

@app.route('/account/data', methods=['GET'])
@login_required
def accountData():
  """Data for the current user"""

  user = getAuthData()

  now_str = datetime.now().__str__()
  return jsonify({'timestamp': now_str,\
    'user': user})

# New Question
@app.route('/new')
def new():
  """Deliver new question"""
  return render_template('new.html')

@app.route('/new/data', methods=['GET'])
def newData():
  """Data for the new question"""

  user = getAuthData()

  now_str = datetime.now().__str__()
  return jsonify({'timestamp': now_str,\
    'user': user})

# QuestionList
@app.route('/questions')
def questionList():
  """Initial contact. Give the initial page."""
  return render_template('questions.html')

@app.route('/questions/data', methods=['GET'])
def questionListData():
  """Data for the list of questions """

  user = getAuthData()
  question_list = storage.getQuestionList()
  question_list_user = storage.getQuestionListUser(user['username'])

  now_str = datetime.now().__str__()
  return jsonify({'timestamp': now_str,\
    'user': user,\
    'questionsUser': question_list_user,\
    'questions': question_list})

# Question
@app.route('/q/<question_id>')
def question(question_id):
  """Deliver user info page"""
  return render_template('question.html', question_id=question_id)

@app.route('/q/<question_id>/data', methods=['GET'])
def questionData(question_id):
  """Data for a question"""
  
  user = getAuthData()

  question = storage.getQuestion(question_id)
  questionGraph = storage.getQuestionGraph(question_id)

  now_str = datetime.now().__str__()
  return jsonify({'timestamp': now_str,\
    'user': user,\
    'question': question,\
    'questionGraph': questionGraph})
  
# Answer
@app.route('/a/<answer_set_id>')
def answerSet(answer_set_id):
  """Deliver answerset page for a given id"""
  return render_template('answerset.html', answer_set_id=answer_set_id)

@app.route('/a/<answer_set_id>/data', methods=['GET'])
def answerSetData(answer_set_id):
  """Data for an answerset """
  
  user = getAuthData()
  answer_set = storage.getAnswerSet(answer_set_id)
  answer_set_graph = storage.getAnswerGraph(answer_set_id)

  now_str = datetime.now().__str__()
  return jsonify({'timestamp': now_str,\
    'user': user,\
    'answerSet': answer_set,\
    'answerSetGraph': answer_set_graph})

# Admin
@app.route('/admin')
def admin():
  """Deliver admin page"""
  user = getAuthData()

  if user['is_admin']:
    return render_template('admin.html')
  else:
    return redirect(url_for('security.login', next=request.url))

@app.route('/admin/data', methods=['GET'])
def adminData():
  """Data for admin display """
  
  user = getAuthData()
  
  if not user['is_admin']:
    return redirect(url_for('security.login', next='/admin'))
  else:
    now_str = datetime.now().__str__()
    users = storage.getUserList()
    questions = storage.getQuestionList()
    answer_sets = storage.getAnswerSetList()

    return jsonify({'timestamp': now_str,\
      'users': users,\
      'questions': questions,\
      'answerSets': answer_sets})

################################################################################
##### Account Editing ##########################################################
################################################################################
@app.route('/account/edit', methods=['POST'])
@login_required
def accountEdit():
    """Edit account information (if request is for current_user)"""

################################################################################
##### New Question #############################################################
################################################################################
@app.route('/new/start', methods=['POST'])
def newStart():
    """Initiate a process for a new question"""

@app.route('/new/search', methods=['POST'])
def newSearch():
    """Validate/provide suggestions for a search term"""

@app.route('/new/validate', methods=['POST'])
def newValidate():
    """Validate a machine question to ensure it could possibly be executed"""

@app.route('/new/translate', methods=['POST'])
def newTranslate():
    """Translate a natural language question into a machine question"""

################################################################################
##### Question Editing, Forking ################################################
################################################################################
@app.route('/q/edit', methods=['POST'])
def questionEdit():
    """Edit the properties of a question"""

@app.route('/q/fork', methods=['POST'])
def questionFork():
    """Fork a question to form a new question owned by current_user """

@app.route('/q/delete', methods=['POST'])
def questionDelete():
    """Delete question (if owned by current_user)"""

################################################################################
##### Admin Interface ##########################################################
################################################################################

@app.route('/admin/q/delete', methods=['POST'])
def adminQuestionDelete():
    """Delete question (if current_user is admin)"""

@app.route('/admin/q/edit', methods=['POST'])
def adminQuestionEdit():
    """Edit question (if current_user is admin)"""

@app.route('/admin/u/delete', methods=['POST'])
def adminUserDelete():
    """Delete user (if current_user is admin)"""

@app.route('/admin/u/edit', methods=['POST'])
def adminUserEdit():
    """Delete Edit (if current_user is admin)"""

@app.route('/admin/a/delete', methods=['POST'])
def adminAnswersetEdit():
    """Delete Answerset (if current_user is admin)"""


################################################################################
##### Run Webserver ############################################################
################################################################################

if __name__ == '__main__':
    # Our local config is in the main directory
    
    # We will use this host and port if we are running from python and not gunicorn
    global local_config
    config_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..')
    json_file = os.path.join(config_dir,'config.json')
    with open(json_file, 'rt') as json_in:
        local_config = json.load(json_in)
        
    app.run(host=local_config['serverHost'],\
        port=local_config['port'],\
        debug=False,\
        use_reloader=False)