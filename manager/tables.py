"""Classes for SQLAlchemy implementation of Message structure."""
import logging
import datetime
import enum

from sqlalchemy import Column, String, Integer, ForeignKeyConstraint, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import inspect
from sqlalchemy.types import JSON

from manager.setup_db import Base
import manager.user  # pylint: disable=W0611
import manager.task  # pylint: disable=W0611


ANSWERSET_ID_TYPE = String
QUESTION_ID_TYPE = String
QGRAPH_ID_TYPE = Integer
logger = logging.getLogger(__name__)


class FromDictMixin():
    """Mixin for transformation to/from json/dict."""

    constructors = {}
    dump_attributes = []

    def __init__(self, *args, **kwargs):
        """Initialize FromDictMixin."""
        pass

    def preprocess_args(self, *args, **kwargs):
        """Prepare arguments for SQLAlchemy Model initializer."""
        if args and isinstance(args[0], dict):
            kwargs2 = args[0]
            kwargs2.update(kwargs)
            kwargs = kwargs2
        for key in kwargs:
            value = kwargs[key]
            if key in self.constructors:
                if isinstance(value, list):
                    value = [x if isinstance(x, self.constructors[key]) else self.constructors[key](x) for x in value]
                else:
                    value = value if isinstance(value, self.constructors[key]) else self.constructors[key](value)
            kwargs[key] = value
        mapper = inspect(self)
        column_names = {x.key for x in mapper.attrs}
        input_names = set(kwargs.keys())
        data_keys = input_names - column_names
        kwargs_keys = input_names - data_keys
        column_kwargs = {key: kwargs[key] for key in kwargs_keys}
        data_kwargs = {key: kwargs[key] for key in data_keys}
        kwargs = {**column_kwargs, 'etc': data_kwargs}
        return kwargs

    def dump(self):
        """Dump object to json."""
        keys = self.dump_attributes
        json = {}
        for key in keys:
            value = getattr(self, key)
            if key == 'etc':
                json.update(value)
            elif isinstance(value, FromDictMixin):
                json[key] = value.dump()
            elif isinstance(value, list) and value and isinstance(value[0], FromDictMixin):
                json[key] = [v.dump() for v in value]
            else:
                json[key] = value
        return json


class QGraph(Base, FromDictMixin):
    """QGraph class."""

    __tablename__ = 'qgraph'
    __table_args__ = (
        {'schema': 'public'},
    )
    id = Column(QGRAPH_ID_TYPE, primary_key=True)
    body = Column(JSON)
    etc = Column(JSON)

    def __init__(self, *args, **kwargs):
        """Initialize QGraph."""
        if len(args) != 1:
            raise RuntimeError('QGraph() expects exactly one positional argument.')
        kwargs['body'] = args[0]
        super().__init__(**kwargs)

    def dump(self):
        """Dump object to json."""
        return self.body


class QuestionVisibility(enum.Enum):
    """Question visibility enum class for db."""

    private = 0
    public = 1
    promoted = 2


class Question(Base, FromDictMixin):
    """Question class."""

    __tablename__ = 'question'
    __table_args__ = (
        ForeignKeyConstraint(['owner_id'], ['private.user.id']),
        ForeignKeyConstraint(['qgraph_id'], ['public.qgraph.id']),
        {'schema': 'public'},
    )
    id = Column(QUESTION_ID_TYPE, primary_key=True)
    natural_question = Column(String)
    notes = Column(String)
    owner_id = Column(Integer)
    qgraph_id = Column(QGRAPH_ID_TYPE)
    etc = Column(JSON)
    timestamp = Column(DateTime)
    visibility = Column(Enum(QuestionVisibility), default=QuestionVisibility.private)

    owner = relationship(
        'User',
        backref=backref(
            'questions',
            uselist=True  # do not delete Question when User is deleted
        )
    )
    question_graph = relationship(
        'QGraph',
        backref=backref(
            'Question',  # do not delete Question when QGraph is deleted?
        ),
        cascade='delete,all'  # delete QGraph when Question is deleted
    )

    owner_email = association_proxy('owner', 'email')

    constructors = {
        'question_graph': QGraph
    }

    dump_attributes = ['id', 'owner_email', 'natural_question', 'question_graph', 'timestamp', 'notes', 'visibility']

    def __init__(self, *args, **kwargs):
        """Initialize Question."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)
        self.timestamp = datetime.datetime.now()


class Answer(Base):
    """Answer class."""

    __tablename__ = 'answer'
    __table_args__ = (
        ForeignKeyConstraint(['answerset_id', 'qgraph_id'], ['public.answerset.id', 'public.answerset.qgraph_id']),
        {'schema': 'public'},
    )
    id = Column(Integer, primary_key=True)
    answerset_id = Column(ANSWERSET_ID_TYPE)
    qgraph_id = Column(QGRAPH_ID_TYPE)
    body = Column(JSON)
    etc = Column(JSON)

    answerset = relationship(
        'Answerset',
        foreign_keys=[answerset_id, qgraph_id],
        backref=backref(
            'answers',
            uselist=True,
            cascade='delete,all'  # delete Answers when Answerset is deleted
        )
    )

    qgraph = relationship(
        'QGraph',
        primaryjoin='foreign(Answer.qgraph_id)==QGraph.id',
        backref=backref(
            'answers',
            uselist=True,
            cascade='delete,all'  # delete Answers when QGraph is deleted
        )
    )

    def __init__(self, *args, **kwargs):
        """Initialize Answer."""
        if len(args) != 1:
            raise RuntimeError('Answer() expects exactly one positional argument.')
        kwargs['body'] = args[0]
        super().__init__(**kwargs)

    def dump(self):
        """Dump object to json."""
        return self.body


class Answerset(Base, FromDictMixin):
    """Answerset class."""

    __tablename__ = 'answerset'
    __table_args__ = (
        ForeignKeyConstraint(['qgraph_id'], ['public.qgraph.id']),
        {'schema': 'public'},
    )
    id = Column(ANSWERSET_ID_TYPE, primary_key=True)
    qgraph_id = Column(QGRAPH_ID_TYPE, primary_key=True)
    timestamp = Column(DateTime)

    qgraph = relationship(
        'QGraph',
        backref=backref(
            'answersets',
            uselist=True,
            cascade='delete,all'  # delete Answersets when QGraph is deleted
        )
    )

    etc = Column(JSON)

    def __init__(self, *args, **kwargs):
        """Initialize Answerset."""
        if len(args) != 1:
            raise RuntimeError('Answerset() expects exactly one positional argument.')
        super().__init__(**kwargs)
        self.answers = [Answer(a, qgraph_id=self.qgraph_id) for a in args[0]]
        self.timestamp = datetime.datetime.now()

    def dump(self):
        """Dump answerset as json."""
        return [a.dump() for a in self.answers]