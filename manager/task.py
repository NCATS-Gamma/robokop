"""Task object module."""
import os
import datetime
import json
import logging

import redis

from sqlalchemy.orm import relationship, backref
from sqlalchemy import Column, DateTime, String, ForeignKey
from sqlalchemy.types import JSON

from manager.setup import Base, db
from manager.question import Question
import manager.logging_config


logger = logging.getLogger(__name__)


class Task(db.Model):
    """Task object."""

    __tablename__ = 'task'
    id = Column(String, primary_key=True)
    type = Column(String)
    initiator = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    question_id = Column(String, ForeignKey('question.id'))
    _result = Column(JSON)

    question = relationship(
        Question,
        backref=backref('tasks',
                        uselist=True,
                        cascade='delete,all'))

    def __init__(self, *args, **kwargs):
        """Create task object."""
        # initialize all properties
        self.id = None
        self.type = None
        self.initiator = None
        self.question_id = None

        # apply json properties to existing attributes
        attributes = self.__dict__.keys()
        if args:
            struct = args[0]
            for key in struct:
                if key in attributes:
                    setattr(self, key, struct[key])
                else:
                    logger.warning("JSON field '%s' ignored.", key)

        # override any json properties with the named ones
        for key in kwargs:
            if key in attributes:
                setattr(self, key, kwargs[key])
            else:
                logger.warning("Keyword argument '%s' ignored.", key)

    @property
    def status(self):
        """Task status."""
        if self.result is not None:
            return self.result['status']
        else:
            return None

    @property
    def result(self):
        """Task result."""
        if self._result is not None:
            return self._result

        r = redis.Redis(
            host=os.environ['RESULTS_HOST'],
            port=os.environ['RESULTS_PORT'],
            db=os.environ['MANAGER_RESULTS_DB'],
            password=os.environ['RESULTS_PASSWORD'])
        value = r.get(f'celery-task-meta-{self.id}')
        if value is None:
            return None
        result = json.loads(value)
        # only store result permanently if task is complete
        # this let's us know when a task is lost rather than busy
        if result['status'] in ['SUCCESS', 'FAILURE', 'REVOKED']:
            self._result = result
            db.session.commit()
        return result

    def to_json(self):
        """Export task as JSON-ifiable dict."""
        keys = [str(column).split('.')[-1] for column in self.__table__.columns] + ['status', 'result']
        struct = {key: getattr(self, key) for key in keys}
        struct['timestamp'] = struct['timestamp'].isoformat()
        return struct


def list_tasks(session=None):
    """Return all tasks."""
    if session is None:
        session = db.session
    return session.query(Task).all()


def get_task_by_id(task_id, session=None):
    """Return all tasks with id == task_id."""
    if session is None:
        session = db.session
    task = session.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise KeyError("No such task.")
    return task
