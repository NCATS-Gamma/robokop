"""
Feedback class
"""

import datetime

from sqlalchemy import Column, DateTime, String, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship, backref

from question import Question
from answer import Answer
from user import User
from setup import db
from util import DictLikeMixin

Impact = Enum('one', 'two', 'three', 'four', 'five',\
    name='impact')

Correctness = Enum('incorrect', 'doubtful', 'maybe', 'probably', 'correct',\
    name='correctness')

class Feedback(db.Model, DictLikeMixin):
    '''
    Represents a chunk of feedback concerning a specific Answer.
    '''

    __tablename__ = 'feedback'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    impact = Column(Impact)
    correctness = Column(Correctness)
    notes = Column(String)
    answer_id = Column(Integer, ForeignKey('answer.id'))
    question_id = Column(Integer, ForeignKey('question.id'))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship(
        User,
        backref=backref('feedback',
                        uselist=True,
                        cascade='delete,all'))
    question = relationship(
        Question)
    answer = relationship(
        Answer)

    def __init__(self, *args, **kwargs):
        '''
        f = Feedback(struct, kw0=value, ...)
        f = Feedback(kw0=value, ...)
        '''

        # initialize all properties
        self.user = None
        self.answer = None
        self.impact = None
        self.correctness = None
        self.notes = None

        self.init_from_args(*args, **kwargs)

        db.session.add(self)
        db.session.commit()

    def __str__(self):
        return "<ROBOKOP Feedback id={}>".format(self.id)

def get_feedback_by_id(id):
    return db.session.query(Feedback).filter(Feedback.id == id).first()

def list_feedback_by_question(question):
    return db.session.query(Feedback).filter(Feedback.question == question).all()

def list_feedback_by_question_answerset(question, answerset):
    return db.session.query(Feedback).filter(Feedback.question == question).filter(Feedback.answer in answerset).all()

def list_feedback_by_question_answer(question, answer):
    return db.session.query(Feedback).filter(Feedback.question == question).filter(Feedback.answer == answer).all()
