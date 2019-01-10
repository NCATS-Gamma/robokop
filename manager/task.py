"""Task object module."""
import os
import datetime
import json
import logging

import redis

from sqlalchemy.orm import relationship, backref, object_session
from sqlalchemy import Column, DateTime, String, ForeignKeyConstraint
from sqlalchemy.types import JSON

from manager.setup_db import Base, session_scope
import manager.logging_config


logger = logging.getLogger(__name__)

# Dictionary to keep task types consistent
TASK_TYPES = {
    "answer": "manager.tasks.answer_question",
    "update": "manager.tasks.update_kg"
}

class Task(Base):
    """Task object."""

    __tablename__ = 'task'
    __table_args__ = (
        ForeignKeyConstraint(['question_id'], ['public.question.id']),
        {'schema': 'public'}
    )
    id = Column(String, primary_key=True)
    type = Column(String)
    initiator = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    end_timestamp = Column(DateTime)
    question_id = Column(String)
    _result = Column(JSON)
    remote_task_id = Column(String)

    question = relationship(
        'Question',
        backref=backref(
            'tasks',
            uselist=True,
            cascade='delete,all'  # delete Tasks if Question is deleted
        )
    )

    def __init__(self, *args, **kwargs):
        """Create task object."""
        # initialize all properties
        self.id = None
        self.type = None
        self.initiator = None
        self.question_id = None
        self.remote_task_id = None

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
            password=os.environ['RESULTS_PASSWORD'],
            db=os.environ['MANAGER_RESULTS_DB'])
        value = r.get(f'celery-task-meta-{self.id}')
        if value is None:
            return None
        result = json.loads(value)
        # only store result permanently if task is complete
        # this let's us know when a task is lost rather than busy
        if result['status'] in ['SUCCESS', 'FAILURE', 'REVOKED']:
            self._result = result
            session = object_session(self)
            session.commit()
        return result

    def to_json(self):
        """Export task as JSON-ifiable dict."""
        keys = [str(column).split('.')[-1] for column in self.__table__.columns] + ['status', 'result']
        struct = {key: getattr(self, key) for key in keys}
        struct['timestamp'] = struct['timestamp'].isoformat()
        if struct['end_timestamp']:
            struct['end_timestamp'] = struct['end_timestamp'].isoformat()

        return struct

# def list_tasks():
#     """Return all tasks."""
#     with session_scope() as session:
#         tasks = session.query(Task).all()
#         task_jsons = [task.to_json() for task in tasks]
#     return task_jsons


def get_task_by_id(task_id):
    """Return all tasks with id == task_id."""
    with session_scope() as session:
        task = session.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise KeyError("No such task.")
        task_json = task.to_json()
    return task_json


def save_task_info(task_id, question_id, task_type, initiator, remote_task_id=None):
    """Saves task information to database."""
    with session_scope() as session:
        task = Task(
            id=task_id,
            question_id=question_id,
            type=task_type,
            initiator=initiator,
            remote_task_id=remote_task_id
        )
        session.add(task)

def save_remote_task_info(task_id, remote_task_id):
    """ Updates the endtime of task when task is done"""
    with session_scope() as session:
        task = session.query(Task).get(task_id)
        task.remote_task_id = remote_task_id
        session.commit()

def save_final_task_info(task_id):
    """ Updates the endtime of task when task is done"""
    with session_scope() as session:
        task = session.query(Task).get(task_id)
        task.end_timestamp = datetime.datetime.utcnow()
        session.commit()
