import os
import sys
import json
import hashlib
import warnings
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-rank'))
from answer import Answer, AnswerSet

from sqlalchemy.types import JSON
from sqlalchemy import Column, DateTime, String, Integer, Float, ForeignKey, func
from sqlalchemy.orm import relationship, backref

from setup import db

import enum

class Interestingness(enum.Enum):
    one = 1
    two = 2
    three = 3
    four = 4
    five = 5

class Correctness(enum.Enum):
    incorrect = 1
    doubtful = 2
    maybe = 3
    probably = 4
    correct = 5

class Feedback(db.Model):
    '''
    Represents a chunk of feedback concerning a specific Answer.
    '''

    __tablename__ = 'question'
    id = Column(String, primary_key=True)
    user = Column(Integer, ForeignKey('user.id'))
    interestingness = Column(Interestingness)
    correctness = Column(Correctness)
    notes = Column(String)

    answer = relationship(
        Answer,
        backref=backref('feedback',
                        uselist=True,
                        cascade='delete,all'))

    def __init__(self, *args, **kwargs):
        '''
        f = Feedback(struct, kw0=value, ...)
        f = Feedback(kw0=value, ...)
        '''

        # initialize all properties
        self.id = None
        self.user = None
        self.interestingness = None
        self.correctness = None
        self.notes = None

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
        return "<ROBOKOP Feedback id={}>".format(self.id)

    def toJSON(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key:getattr(self, key) for key in keys}
        return struct

def get_feedback_by_id(id):
    return db.session.query(Feedback).filter(Feedback.id == id).first()

def get_feedback_by_answer(answer):
    return db.session.query(Feedback).filter(Feedback.answer == answer).all()