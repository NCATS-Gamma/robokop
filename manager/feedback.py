"""Feedback class."""

import datetime

from sqlalchemy import Column, DateTime, String, Integer, ForeignKeyConstraint
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.associationproxy import association_proxy

from manager.user import User
from manager.setup import db
from manager.util import DictLikeMixin


class Feedback(db.Model, DictLikeMixin):
    """Represents a chunk of feedback concerning a specific Answer."""

    __tablename__ = 'feedback'
    __table_args__ = (
        ForeignKeyConstraint(['user_id'], ['private.user.id']),
        ForeignKeyConstraint(['answer_id'], ['public.answer.id']),
        {'schema': 'public'}
    )
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    impact = Column(Integer)
    accuracy = Column(Integer)
    notes = Column(String)
    answer_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship(
        User,
        backref=backref('feedback',
                        uselist=True,
                        cascade='delete,all'))
    user_email = association_proxy('user', 'email')
    answer = relationship(
        'Answer')

    def __init__(self, *args, **kwargs):
        """Initialize feedback object.

        f = Feedback(struct, kw0=value, ...)
        f = Feedback(kw0=value, ...)
        """
        # initialize all properties
        self.user_id = None
        self.answer_id = None
        self.impact = None
        self.accuracy = None
        self.notes = None

        self.init_from_args(*args, **kwargs)

    def __str__(self):
        """Return string summary of feedback."""
        return "<ROBOKOP Feedback id={}>".format(self.id)

    def to_json(self):
        """Generate json representation of feedback."""
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key: getattr(self, key) for key in keys}
        if 'timestamp' in struct:
            struct['timestamp'] = struct['timestamp'].isoformat()
        struct['user_email'] = self.user_email
        struct.pop('user_id')
        return struct
