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
from manager.setup import db
from manager.logging_config import logger

class Question(db.Model):
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
    name = Column(String)
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
        self.name = None
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

        db.session.add(self)
        db.session.commit()

    def __str__(self):
        return "<ROBOKOP Question id={}>".format(self.id)

    def to_json(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns] + ['tasks']
        struct = {key:getattr(self, key) for key in keys}
        struct['tasks'] = [t.to_json() for t in struct['tasks']]
        return struct

class Task(db.Model):
    __tablename__ = 'task'
    id = Column(String, primary_key=True)
    type = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    question_id = Column(String, ForeignKey('question.id'))

    question = relationship(
        Question,
        backref=backref('tasks',
                        uselist=True,
                        cascade='delete,all'))

    def __init__(self, *args, **kwargs):

        # initialize all properties
        self.id = None
        self.type = None
        self.question_id = None

        # apply json properties to existing attributes
        attributes = self.__dict__.keys()
        logger.debug(attributes)
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

        db.session.add(self)
        db.session.commit()

    @property
    def status(self):
        """Task status."""
        r = redis.Redis(
            host=os.environ['RESULTS_HOST'],
            port=os.environ['RESULTS_PORT'],
            db=os.environ['MANAGER_RESULTS_DB'])
        value = r.get(f'celery-task-meta-{self.id}')
        task = json.loads(value) if value is not None else None
        return task['status']

    def to_json(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns] + ['status']
        struct = {key:getattr(self, key) for key in keys}
        struct['timestamp'] = struct['timestamp'].isoformat()
        return struct

def list_questions():
    return db.session.query(Question).all()

def list_tasks():
    return db.session.query(Task).all()

def list_questions_by_username(username, invert=False):
    if invert:
        return db.session.query(Question).join(Question.user).filter(User.username != username).all()
    else:
        return db.session.query(Question).join(Question.user).filter(User.username == username).all()

def list_questions_by_user_id(user_id, invert=False):
    if invert:
        return db.session.query(Question).filter(Question.user_id != user_id).all()
    else:
        return db.session.query(Question).filter(Question.user_id == user_id).all()

def get_question_by_id(id):
    question = db.session.query(Question).filter(Question.id == id).first()
    if not question:
        raise KeyError("No such question.")
    return question
