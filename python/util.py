import os
import requests
from flask_security.core import current_user
from werkzeug.routing import BaseConverter

class QAConverter(BaseConverter):

    def to_python(self, value):
        qid, aid = value.split('_')
        return [qid, int(aid)]

    def to_url(self, values):
        return '_'.join(BaseConverter.to_url(value) for value in values)

def get_tasks():
    flower_url = 'http://{}:{}/api/tasks'.format(os.environ['FLOWER_ADDRESS'], os.environ['FLOWER_PORT'])
    response = requests.get(flower_url, auth=(os.environ['FLOWER_USER'], os.environ['FLOWER_PASSWORD']))
    return response.json()

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