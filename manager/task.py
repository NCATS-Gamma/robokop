"""Task object module."""
import os
import datetime
import json
import logging

import redis

from sqlalchemy.orm import relationship, backref
from sqlalchemy import Column, DateTime, String, ForeignKey

from manager.setup import db
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
        """Export task as JSON-ifiable dict."""
        keys = [str(column).split('.')[-1] for column in self.__table__.columns] + ['status']
        struct = {key: getattr(self, key) for key in keys}
        struct['timestamp'] = struct['timestamp'].isoformat()
        return struct


def list_tasks():
    """Return all tasks."""
    return db.session.query(Task).all()


def get_task_by_id(task_id):
    """Return all tasks with id == task_id."""
    task = db.session.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise KeyError("No such task.")
    return task
