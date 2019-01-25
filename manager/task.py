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
    starting_timestamp = Column(DateTime)
    end_timestamp = Column(DateTime)
    question_id = Column(String)
    result = Column(JSON)
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
        self.result = {}

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

    def get_result(self):
        """Fetch task result from celery results db."""

        r = redis.Redis(
            host=os.environ['RESULTS_HOST'],
            port=os.environ['RESULTS_PORT'],
            password=os.environ['RESULTS_PASSWORD'],
            db=os.environ['MANAGER_RESULTS_DB'])
        value = r.get(f'celery-task-meta-{self.id}')
        if value is None:
            return None
        r = json.loads(value)
        return r

    def to_json(self):
        """Export task as JSON-ifiable dict."""
        keys = [str(column).split('.')[-1] for column in self.__table__.columns] + ['status', 'result']
        struct = {key: getattr(self, key) for key in keys}
        struct['timestamp'] = struct['timestamp'].isoformat()
        if struct['end_timestamp']:
            struct['end_timestamp'] = struct['end_timestamp'].isoformat()
        if struct['starting_timestamp']:
            struct['starting_timestamp'] = struct['starting_timestamp'].isoformat()

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


def save_starting_task_info(task_id):
    """ Updates the time when the task was started """
    with session_scope() as session:
        task = session.query(Task).get(task_id)
        task.starting_timestamp = datetime.datetime.utcnow()
        session.commit()

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

def save_task_result(task_id):
    with session_scope() as session:
        task = session.query(Task).get(task_id)
        task.result = task.get_result()
        session.commit()

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
