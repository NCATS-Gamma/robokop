"""
ROBOKOP utilities
"""

import os
import warnings
import logging
import json
import requests
from flask_security.core import current_user

def get_tasks():
    flower_url = f'http://{os.environ["FLOWER_HOST"]}:{os.environ["FLOWER_PORT"]}/api/tasks'
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
        username = current_user.email
        is_admin = current_user.has_role('admin')

    return {'is_authenticated': is_authenticated,\
            'is_active': is_active,\
            'is_anonymous': is_anonymous,\
            'is_admin': is_admin,\
            'username': username}

class DictLikeMixin():
    def init_from_args(self, *args, **kwargs):
        # apply json properties to existing attributes
        attributes = self.__dict__.keys()
        if args:
            if len(args) > 1:
                warnings.warn("Positional arguments after the first are ignored.")
            struct = args[0]
            for key in struct:
                if key in attributes:
                    setattr(self, key, self.preprocess(key, struct[key]))
                else:
                    warnings.warn("JSON field {} ignored.".format(key))

        # override any json properties with the named ones
        for key in kwargs:
            if key in attributes:
                setattr(self, key, self.preprocess(key, kwargs[key]))
            else:
                warnings.warn("Keyword argument {} ignored.".format(key))

    def preprocess(self, key, value):
        return value

    def to_json(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key:getattr(self, key) for key in keys}
        return struct