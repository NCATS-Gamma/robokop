"""
Feedback class
"""

import datetime

from sqlalchemy import Column, DateTime, String, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.associationproxy import association_proxy

from manager.question import Question
from manager.answer import Answer
from manager.user import User
from manager.setup import db
from manager.util import DictLikeMixin

class Feedback(db.Model, DictLikeMixin):
    '''
    Represents a chunk of feedback concerning a specific Answer.
    '''

    __tablename__ = 'feedback'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    impact = Column(Integer)
    accuracy = Column(Integer)
    notes = Column(String)
    answer_id = Column(Integer, ForeignKey('answer.id'))
    question_id = Column(String, ForeignKey('question.id'))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship(
        User,
        backref=backref('feedback',
                        uselist=True,
                        cascade='delete,all'))
    user_email = association_proxy('user', 'email')
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
        self.user_id = None
        self.answer_id = None
        self.question_id = None
        self.impact = None
        self.accuracy = None
        self.notes = None

        self.init_from_args(*args, **kwargs)

    def __str__(self):
        return "<ROBOKOP Feedback id={}>".format(self.id)

    def to_json(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key:getattr(self, key) for key in keys}
        if 'timestamp' in struct:
            struct['timestamp'] = struct['timestamp'].isoformat()
        struct['user_email'] = self.user_email
        struct.pop('user_id')
        return struct

def get_feedback_by_id(id, session=None):
    if session is None:
        session = db.session
    return session.query(Feedback).filter(Feedback.id == id).first()

def list_feedback_by_question(question, session=None):
    if session is None:
        session = db.session
    return session.query(Feedback).filter(Feedback.question == question).all()

def list_feedback_by_question_answerset(question, answerset, session=None):
    if session is None:
        session = db.session
    return session.query(Feedback).filter(Feedback.question == question).filter(Feedback.answer_id.in_([a.id for a in answerset.answers])).all()

def list_feedback_by_question_answer(question, answer, session=None):
    if session is None:
        session = db.session
    return session.query(Feedback).filter(Feedback.question == question).filter(Feedback.answer == answer).all()
