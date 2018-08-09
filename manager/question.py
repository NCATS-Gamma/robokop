'''
Question definition
'''

# standard modules
import os
import sys
import json
import warnings
import datetime

# 3rd-party modules
import redis
from sqlalchemy.types import JSON
from sqlalchemy import Column, DateTime, String, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import declarative_base

# our modules
from manager.user import User
from manager.setup import Base, db
from manager.logging_config import logger

class Question(Base):
    '''
    Represents a question such as "What genetic condition provides protection against disease X?"

    methods:
    * answer() - a struct containing the ranked answer paths
    * cypher() - the appropriate Cypher query for the Knowledge Graph
    '''

    __tablename__ = 'question'
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    natural_question = Column(String)
    notes = Column(String)
    machine_question = Column(JSON)

    user = relationship(
        User,
        backref=backref('questions',
                        uselist=True,
                        cascade='delete,all'))

    def __init__(self, *args, **kwargs):
        '''
        keyword arguments: id, user, notes, natural_question, nodes, edges
        q = Question(kw0=value, ...)
        q = Question(struct, ...)
        '''

        # initialize all properties
        self.user_id = None
        self.id = None
        self.notes = None
        self.natural_question = None
        self.machine_question = None

        # apply json properties to existing attributes
        attributes = self.__dict__.keys()
        if args:
            struct = args[0]
            for key in struct:
                if key in attributes:
                    setattr(self, key, struct[key])
                else:
                    warnings.warn("JSON field {} ignored.".format(key))

        # override any json properties with the named ones
        for key in kwargs:
            if key in attributes:
                setattr(self, key, kwargs[key])
            else:
                warnings.warn("Keyword argument {} ignored.".format(key))

    def __str__(self):
        return "<ROBOKOP Question id={}>".format(self.id)

    def to_json(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns] + ['tasks']
        struct = {key:getattr(self, key) for key in keys}
        struct['tasks'] = [t.to_json() for t in struct['tasks']]
        return struct

def list_questions(session=None):
    if session is None:
        session = db.session
    return session.query(Question).all()

def list_questions_by_username(username, invert=False, session=None):
    if session is None:
        session = db.session
    if invert:
        return session.query(Question).join(Question.user).filter(User.username != username).all()
    else:
        return session.query(Question).join(Question.user).filter(User.username == username).all()

def list_questions_by_user_id(user_id, invert=False, session=None):
    if session is None:
        session = db.session
    if invert:
        return session.query(Question).filter(Question.user_id != user_id).all()
    else:
        return session.query(Question).filter(Question.user_id == user_id).all()

def get_question_by_id(id, session=None):
    if session is None:
        session = db.session
    question = session.query(Question).filter(Question.id == id).first()
    if not question:
        raise KeyError("No such question.")
    return question
