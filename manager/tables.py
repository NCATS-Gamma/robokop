"""Classes for SQLAlchemy implementation of Message structure."""
import logging

from sqlalchemy import Column, String, Integer, ForeignKeyConstraint
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy import inspect
from sqlalchemy.types import JSON

from manager.setup import db, app, engine
import manager.user  # pylint: disable=W0611
import manager.task  # pylint: disable=W0611


MESSAGE_ID_TYPE = String
QUESTION_ID_TYPE = String
logger = logging.getLogger(__name__)


class FromDictMixin():
    """Mixin for transformation to/from json/dict."""

    constructors = {}
    attributes = []

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
        kwargs = {**column_kwargs, 'data': data_kwargs}
        return kwargs

    def dump(self):
        """Dump object to json."""
        keys = self.attributes
        json = {}
        for key in keys:
            value = getattr(self, key)
            if key == 'data':
                json.update(value)
            elif isinstance(value, FromDictMixin):
                json[key] = value.dump()
            elif isinstance(value, list) and value and isinstance(value[0], FromDictMixin):
                json[key] = [v.dump() for v in value]
            else:
                json[key] = value
        return json


class KNode(db.Model, FromDictMixin):
    """KNode class."""

    __tablename__ = 'knode'
    __table_args__ = (
        ForeignKeyConstraint(['kgraph_id'], ['public.kgraph.id']),
        {'schema': 'public'},
    )
    id = Column(String, primary_key=True)
    type = Column(String)
    kgraph_id = Column(Integer, primary_key=True)
    data = Column(JSON)

    kgraph = relationship(
        'KGraph',
        backref=backref(
            'nodes',
            uselist=True,
            cascade='delete,all'  # delete KNode when KGraph is deleted
        )
    )

    attributes = ['id', 'type']

    def __init__(self, *args, **kwargs):
        """Initialize KNode."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)


class KEdge(db.Model, FromDictMixin):
    """KEdge class."""

    __tablename__ = 'kedge'
    __table_args__ = (
        ForeignKeyConstraint(['source_id', 'kgraph_id'], ['public.knode.id', 'public.knode.kgraph_id']),
        ForeignKeyConstraint(['target_id', 'kgraph_id'], ['public.knode.id', 'public.knode.kgraph_id']),
        ForeignKeyConstraint(['kgraph_id'], ['public.kgraph.id']),
        {'schema': 'public'},
    )
    id = Column(String, primary_key=True)
    type = Column(String)
    source_id = Column(String)
    target_id = Column(String)
    kgraph_id = Column(Integer, primary_key=True)
    data = Column(JSON)

    source = relationship(
        'KNode',
        foreign_keys=[source_id],
        backref=backref(
            'outgoing_edges',
            uselist=True,
            cascade='delete,all'  # delete KEdge when source KNode is deleted
        )
    )
    target = relationship(
        'KNode',
        foreign_keys=[target_id],
        backref=backref(
            'incoming_edges',
            uselist=True,
            cascade='delete,all'  # delete KEdge when target KNode is deleted
        )
    )
    kgraph = relationship(
        'KGraph',
        backref=backref(
            'edges',
            uselist=True,
            cascade='delete,all'  # delete KEdge when KGraph is deleted
        )
    )

    attributes = ['id', 'source_id', 'target_id', 'type']

    def __init__(self, *args, **kwargs):
        """Initialize KEdge."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)


class KGraph(db.Model, FromDictMixin):
    """KGraph class."""

    __tablename__ = 'kgraph'
    __table_args__ = (
        ForeignKeyConstraint(['message_id'], ['public.message.id']),
        {'schema': 'public'},
    )
    id = Column(Integer, primary_key=True)
    message_id = Column(MESSAGE_ID_TYPE)
    data = Column(JSON)

    message = relationship(
        'Message',
        foreign_keys=[message_id]
    )

    constructors = {
        'nodes': KNode,
        'edges': KEdge
    }

    attributes = ['id', 'nodes', 'edges']

    def __init__(self, *args, **kwargs):
        """Initialize KGraph."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)


class QNode(db.Model, FromDictMixin):
    """QNode class."""

    __tablename__ = 'qnode'
    __table_args__ = (
        ForeignKeyConstraint(['qgraph_id'], ['public.qgraph.id']),
        {'schema': 'public'},
    )
    id = Column(String, primary_key=True)
    type = Column(String)
    curie = Column(String)
    qgraph_id = Column(Integer, primary_key=True)
    data = Column(JSON)

    qgraph = relationship(
        'QGraph',
        backref=backref(
            'nodes',
            uselist=True,
            cascade='delete,all'  # delete QNode when QGraph is deleted
        )
    )

    knodes = association_proxy('bindings', 'knode')

    attributes = ['id', 'type', 'curie']

    def __init__(self, *args, **kwargs):
        """Initialize QNode."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)


class QEdge(db.Model, FromDictMixin):
    """QEdge class."""

    __tablename__ = 'qedge'
    __table_args__ = (
        ForeignKeyConstraint(['source_id', 'qgraph_id'], ['public.qnode.id', 'public.qnode.qgraph_id']),
        ForeignKeyConstraint(['target_id', 'qgraph_id'], ['public.qnode.id', 'public.qnode.qgraph_id']),
        ForeignKeyConstraint(['qgraph_id'], ['public.qgraph.id']),
        {'schema': 'public'},
    )
    id = Column(String, primary_key=True)
    source_id = Column(String)
    target_id = Column(String)
    type = Column(String)
    qgraph_id = Column(Integer, primary_key=True)
    data = Column(JSON)

    source = relationship(
        'QNode',
        foreign_keys=[source_id],
        backref=backref(
            'outgoing_edges',
            uselist=True,
            cascade='delete,all'  # delete QEdge when source QNode is deleted
        )
    )
    target = relationship(
        'QNode',
        foreign_keys=[target_id],
        backref=backref(
            'incoming_edges',
            uselist=True,
            cascade='delete,all'  # delete QEdge when target QNode is deleted
        )
    )
    qgraph = relationship(
        'QGraph',
        backref=backref(
            'edges',
            uselist=True,
            cascade='delete,all'  # delete QEdge when QGraph is deleted
        )
    )

    kedges = association_proxy('bindings', 'kedge')

    attributes = ['id', 'source_id', 'target_id', 'type']

    def __init__(self, *args, **kwargs):
        """Initialize QEdge."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)


class QGraph(db.Model, FromDictMixin):
    """QGraph class."""

    __tablename__ = 'qgraph'
    __table_args__ = (
        ForeignKeyConstraint(['message_id'], ['public.message.id']),
        {'schema': 'public'},
    )
    id = Column(Integer, primary_key=True)
    message_id = Column(MESSAGE_ID_TYPE)
    data = Column(JSON)

    message = relationship(
        'Message',
        foreign_keys=[message_id]
    )

    constructors = {
        'nodes': QNode,
        'edges': QEdge
    }

    attributes = ['id', 'nodes', 'edges']

    def __init__(self, *args, **kwargs):
        """Initialize QGraph."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)


class Question(db.Model, FromDictMixin):
    """Question class."""

    __tablename__ = 'question'
    __table_args__ = (
        ForeignKeyConstraint(['owner_id'], ['private.user.id']),
        ForeignKeyConstraint(['qgraph_id'], ['public.qgraph.id']),
        {'schema': 'public'},
    )
    id = Column(QUESTION_ID_TYPE, primary_key=True)
    natural_question = Column(String)
    owner_id = Column(Integer)
    qgraph_id = Column(Integer)
    data = Column(JSON)

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

    attributes = ['id', 'owner_email', 'natural_question', 'question_graph']

    def __init__(self, *args, **kwargs):
        """Initialize Question."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)


class NodeBinding(db.Model):
    """NodeBinding class."""

    __tablename__ = 'nodebinding'
    __table_args__ = (
        ForeignKeyConstraint(['knode_id', 'kgraph_id'], ['public.knode.id', 'public.knode.kgraph_id']),
        ForeignKeyConstraint(['qnode_id', 'qgraph_id'], ['public.qnode.id', 'public.qnode.qgraph_id']),
        ForeignKeyConstraint(['answer_id'], ['public.answer.id']),
        {'schema': 'public'},
    )
    id = Column(Integer, primary_key=True)
    qnode_id = Column(String)
    knode_id = Column(String)
    kgraph_id = Column(Integer)
    qgraph_id = Column(Integer)
    answer_id = Column(Integer)
    data = Column(JSON)

    qnode = relationship(
        'QNode',
        backref=backref(
            'bindings',
            uselist=True,
            cascade='delete,all'  # delete bindings when QNode is deleted
        )
    )
    knode = relationship(
        'KNode'
    )
    answer = relationship(
        'Answer',
        backref=backref(
            'node_bindings',
            uselist=True,
            cascade='delete,all'  # delete bindings when Answer is deleted
        ),
        # primaryjoin='and_(Answer.id == NodeBinding.answer_id, '
        #             'Answer.qgraph_id == foreign(NodeBinding.qgraph_id))'
    )


class EdgeBinding(db.Model):
    """EdgeBinding class."""

    __tablename__ = 'edgebinding'
    __table_args__ = (
        ForeignKeyConstraint(['kedge_id', 'kgraph_id'], ['public.kedge.id', 'public.kedge.kgraph_id']),
        ForeignKeyConstraint(['qedge_id', 'qgraph_id'], ['public.qedge.id', 'public.qedge.qgraph_id']),
        ForeignKeyConstraint(['answer_id'], ['public.answer.id']),
        {'schema': 'public'},
    )
    id = Column(Integer, primary_key=True)
    qedge_id = Column(String)
    kedge_id = Column(String)
    kgraph_id = Column(Integer)
    qgraph_id = Column(Integer)
    answer_id = Column(Integer)
    data = Column(JSON)

    qedge = relationship(
        'QEdge',
        backref=backref(
            'bindings',
            uselist=True,
            cascade='delete,all'  # delete bindings when QEdge is deleted
        )
    )
    kedge = relationship(
        'KEdge'
    )
    answer = relationship(
        'Answer',
        backref=backref(
            'edge_bindings',
            uselist=True,
            cascade='delete,all'  # delete bindings when Answer is deleted
        )
    )


class Answer(db.Model):
    """Answer class."""

    __tablename__ = 'answer'
    __table_args__ = (
        ForeignKeyConstraint(['kgraph_id'], ['public.kgraph.id']),
        ForeignKeyConstraint(['qgraph_id'], ['public.qgraph.id']),
        ForeignKeyConstraint(['message_id'], ['public.message.id']),
        {'schema': 'public'}
    )
    id = Column(Integer, primary_key=True)
    qgraph_id = Column(Integer)
    kgraph_id = Column(Integer)
    message_id = Column(MESSAGE_ID_TYPE)
    data = Column(JSON)

    qgraph = relationship(
        'QGraph',
        backref=backref(
            'answers',
            uselist=True,
            cascade='delete,all'  # delete Answer when QGraph is deleted
        )
    )
    kgraph = relationship(
        'KGraph'
    )
    message = relationship(
        'Message',
        backref=backref(
            'answers',
            uselist=True,
            cascade='delete,all'  # delete Answers when Message is deleted
        )
    )

    def __init__(self, *args, **kwargs):
        """Initialize Answer."""
        if args and isinstance(args[0], dict):
            self.node_bindings = []
            self.edge_bindings = []
            nodes = args[0]["node_bindings"]
            for key in nodes:
                self.node_bindings.append(NodeBinding(
                    qnode_id=key,
                    knode_id=nodes[key]
                ))
            edges = args[0]["edge_bindings"]
            for key in edges:
                self.edge_bindings.append(EdgeBinding(
                    qedge_id=key,
                    kedge_id=edges[key]
                ))
        super().__init__(**kwargs)

    def dump(self):
        """Dump Answer as dict."""
        node_map = {binding.qnode_id: binding.knode_id for binding in self.node_bindings}
        edge_map = {binding.qedge_id: binding.kedge_id for binding in self.edge_bindings}
        return {
            "node_bindings": node_map,
            "edge_bindings": edge_map
        }


class Message(db.Model, FromDictMixin):
    """Message class."""

    __tablename__ = 'message'
    __table_args__ = (
        ForeignKeyConstraint(['kgraph_id'], ['public.kgraph.id']),
        ForeignKeyConstraint(['qgraph_id'], ['public.qgraph.id']),
        {'schema': 'public'},
    )
    id = Column(MESSAGE_ID_TYPE, primary_key=True)
    kgraph_id = Column(Integer)
    qgraph_id = Column(Integer)
    data = Column(JSON)

    question_graph = relationship(
        'QGraph',
        foreign_keys=[qgraph_id],
        cascade='delete,all'  # delete QGraph when Message is deleted
    )
    knowledge_graph = relationship(
        'KGraph',
        foreign_keys=[kgraph_id],
        cascade='delete,all'  # delete KGraph when Message is deleted
    )

    constructors = {
        'question_graph': QGraph,
        'knowledge_graph': KGraph,
        'answers': Answer
    }

    attributes = ['knowledge_graph', 'question_graph', 'answers']

    def __init__(self, *args, **kwargs):
        """Initialize Message."""
        kwargs = self.preprocess_args(*args, **kwargs)
        super().__init__(**kwargs)

def load():
    with app.app_context():
        # Create any database tables that don't exist yet.
        engine.execute('CREATE SCHEMA IF NOT EXISTS private')
        db.create_all()
