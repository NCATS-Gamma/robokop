'''
Answer class
'''

import time
import json
import datetime
import warnings
from sqlalchemy.types import ARRAY as Array
from sqlalchemy import Column, DateTime, String, Integer, Float, ForeignKey
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship, backref

from setup import db

from sqlalchemy import event
from sqlalchemy import DDL

class Answerset(db.Model):
    '''
    An "answer" to a Question.
    Contains a ranked list of walks through the Knowledge Graph.
    '''

    __tablename__ = 'answer_set'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    filename = Column(String)
    question_hash = Column(String)
    creator = Column(String)

    def __init__(self, *args, **kwargs):
        self.answers = []
        self.question_hash = None
        self.filename = None
        self.creator = 'ROBOKOP'
        self.__idx = 0

        # apply json properties to existing attributes
        attributes = self.__dict__.keys()
        if args:
            struct = args[0]
            for key in struct:
                if key in attributes:
                    if key=='answers':
                        struct[key] = [Answer(a) for a in struct[key]]

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
        return "<ROBOKOP Answer Set id={}>".format(self.id)

    def toJSON(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key:getattr(self, key) for key in keys}
        if 'timestamp' in struct:
            struct['timestamp'] = struct['timestamp'].isoformat()
        return struct

    def add(self, answer):
        '''
        Add an Answer to the AnswerSet
        '''

        if not isinstance(answer, Answer):
            raise ValueError("Only Answers may be added to AnswerSets.")

        self.answers += [answer]
        db.session.commit()
        return self

    def __iadd__(self, answer):
        return self.add(answer)

    def __getitem__(self, key):
        return self.answers[key]
        
    def __iter__(self):
        return self

    def __next__(self):
        if self.__idx >= len(self.answers):
            raise StopIteration
        else:
            self.__idx += 1
            return self.answers[self.__idx-1]

    def len(self):
        return len(self.answers)

event.listen(
    Answerset.__table__,
    "after_create",
    DDL("ALTER SEQUENCE answer_set_id_seq RESTART WITH 1453;")
)

class Answer(db.Model):
    '''
    Represents a single answer walk
    '''

    __tablename__ = 'answer'
    id = Column(Integer, primary_key=True)
    # TODO: think about how scoring data should be handled
    # score = Column(Float)
    score = Column(JSON)
    natural_answer = Column(String)
    answer_set_id = Column(Integer, ForeignKey('answer_set.id'))
    nodes = Column(JSON)
    edges = Column(JSON)
    # TODO: move node/edge details to AnswerSet
    # nodes = Column(Array(String))
    # edges = Column(Array(String))

    # Use cascade='delete,all' to propagate the deletion of an AnswerSet onto its Answers
    answer_set = relationship(
        Answerset,
        backref=backref('answers',
                        uselist=True,
                        cascade='delete,all'))

    def __init__(self, *args, **kwargs):
        # initialize all attributes
        self.id = None # int
        self.answer_set = None # AnswerSet
        self.natural_answer = None # str
        self.nodes = [] # list of str
        self.edges = [] # list of str
        self.score = None # float

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

    def __str__(self):
        return "<ROBOKOP Answer id={}>".format(self.id)

    def toJSON(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key:getattr(self, key) for key in keys}
        return struct

    def construct_name(self):
        ''' Construct short name summarizing each subgraph. '''
        names = []
        for node in self.nodes:
            names.append(node['name'])

        short_name = ''
        for name_idx, name in enumerate(names):
            if name_idx > 0:
                #short_name = short_name + '→'
                short_name = short_name + ' » '
            short_name = short_name + name[0:min(len(name), 4)]

        return short_name

def list_answersets():
    return db.session.query(Answerset).all()

def get_answer_by_id(id):
    answer = db.session.query(Answer).filter(Answer.id == id).first()
    if not answer:
        raise KeyError("No such answer.")
    return answer

def list_answers_by_answerset(answerset):
    answers = db.session.query(Answer)\
        .filter(Answer.answer_set == answerset)\
        .all()
    return answers

def get_answerset_by_id(id):
    answerset = db.session.query(Answerset).filter(Answerset.id == id).first()
    if not answerset:
        raise KeyError("No such answerset.")
    return answerset

def list_answersets_by_question_hash(hash):
    asets = db.session.query(Answerset)\
        .filter(Answerset.question_hash == hash)\
        .all()
    return asets