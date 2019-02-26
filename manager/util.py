"""
ROBOKOP utilities
"""

import os
import warnings
import logging

import json
import requests
from flask import session
from celery.task.control import inspect

from manager.user import get_user_by_id

from manager.logging_config import logger

def getAuthData():
    """ Return relevant information from flask session"""
    # is_authenticated
    #   This property should return True if the user is authenticated, i.e. they have provided valid credentials. (Only authenticated users will fulfill the criteria of login_required.)
    # is_active
    #   This property should return True if this is an active user - in addition to being authenticated, they also have activated their account, not been suspended, or any condition your application has for rejecting an account. Inactive accounts may not log in (without being forced of course).
    # is_anonymous
    #   This property should return True if this is an anonymous user. (Actual users should return False instead.)
    
    session_user_id = session.get('user_id')
    if session_user_id:
        logger.debug(f'Got session_user_id {session_user_id} ')
        # We have an authenticated user
        user = get_user_by_id(session_user_id)
        logger.debug(f'Got user {user} ')
        
        is_authenticated = True
        is_active = user['active']
        is_anonymous = False
        is_admin = any(role['name'] == 'admin' for role in user['roles'])
        username = user['email']
        user_id = user['id']
    else:
        is_authenticated = False
        is_active = False
        is_anonymous = True
        is_admin = False
        username = "Anonymous"
        user_id = None

    return {'is_authenticated': is_authenticated,\
            'is_active': is_active,\
            'is_anonymous': is_anonymous,\
            'is_admin': is_admin,\
            'username': username,\
            'email': username,\
            'user_id': user_id,
            'id': user_id}

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