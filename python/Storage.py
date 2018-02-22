import os
import json
from datetime import datetime

class Storage:
  db = None
  
  def __init__(self, db=db):
    self.db = db

  def boot(self, user_datastore):
    # Create any database tables that don't exist yet.
    self.db.create_all()

    # Create the Roles "admin" and "end-user" -- unless they already exist
    user_datastore.find_or_create_role(name='admin', description='Administrator')
    user_datastore.find_or_create_role(name='user', description='End user')

    # Create users for testing purposes -- unless they already exists.
    users = ['homer','marge','bart','lisa','maggie']
    for u in users:
      u_email = u + '@simpsons.com'
      if not user_datastore.get_user(u_email):
        user_datastore.create_user(
          email = u_email,
          username = u_email,
          password = 'abcd',
          active = True,
          confirmed_at = datetime.now(),
        )
      
    
    if not user_datastore.get_user('admin@admin.com'):
        user_datastore.create_user(
          email = 'admin@admin.com',
          username = 'admin@admin.com',
          password = '1234',
          active = True,
          confirmed_at = datetime.now(),
        )
    
    # Commit any database changes; the User and Roles must exist before we can add a Role to the User
    self.db.session.commit()

    # Give users "user" role, and admin the "admin" role. (This will have no effect if the
    # users already have these Roles.)
    for u in users:
      u_email = u + '@simpsons.com'
      user_datastore.add_role_to_user(u_email, 'user')
      
    user_datastore.add_role_to_user('admin@admin.com', 'admin')
    
    # Again, commit any database changes.
    self.db.session.commit()

  def getQuestionList(self):
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','questionList.json')
    with open(file_name) as f:
      return json.load(f)

  def getQuestionListUser(self,user_id):
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','questionList.json')
    with open(file_name) as f:
      return json.load(f)

  def getQuestion(self, question_id):
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','question.json')
    with open(file_name) as f:
      return json.load(f)

  def getQuestionGraph(self, question_id):
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','as0001_ozone_gene.json')
    with open(file_name) as f:
      return json.load(f)

  def getAnswerSetList(self, question_hash='*'):
    # if question_hash is ommitted give all
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','answerSetList.json')
    with open(file_name) as f:
      return json.load(f)

  def getAnswerSet(self, answerset_id):
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','answerSet.json')
    with open(file_name) as f:
      return json.load(f)
  
  def getAnswer(self, answer_id):
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','answer.json')
    with open(file_name) as f:
      return json.load(f)

  def getAnswerSetGraph(self, answer_id):
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','as0001_ozone_gene.json')
    with open(file_name) as f:
      return json.load(f)

  def getAnswerSetFeedback(self, user, answer_id):
    file_name = os.path.join(os.path.dirname(os.path.realpath(__file__)),'..','toyData','answerSetFeedback.json')
    with open(file_name) as f:
      return json.load(f)

  def getUserList(self):
    return [{'username': 'homer@simpsons.com'},{'username': 'marge@simpsons.com'},{'username': 'admin@admin.com'}]
