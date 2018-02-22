import os
import sys
import json
import hashlib
import warnings
from universalgraph import UniversalGraph
from knowledgegraph import KnowledgeGraph
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-rank'))
from nagaProto import ProtocopRank
from answer import Answer, AnswerSet

from sqlalchemy.types import JSON
from sqlalchemy import Column, DateTime, String, Integer, Float, ForeignKey, func
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm.session import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from robokop_flask_config import SQLALCHEMY_DATABASE_URI
engine = create_engine(SQLALCHEMY_DATABASE_URI)

from base import Base

class Question(Base):
    '''
    Represents a question such as "What genetic condition provides protection against disease X?"

    methods:
    * answer() - a struct containing the ranked answer paths
    * cypher() - the appropriate Cypher query for the Knowledge Graph
    '''

    __tablename__ = 'question'
    id = Column(String, primary_key=True)
    user = Column(String) #, ForeignKey('user.id')
    natural_question = Column(String)
    notes = Column(String)
    nodes = Column(JSON)
    edges = Column(JSON)
    name = Column(String)
    hash = Column(String, unique=True)

    def __init__(self, *args, **kwargs):
        '''
        keyword arguments: id, user, notes, natural_question, nodes, edges
        q = Question(kw0=value, ...)
        q = Question(struct, ...)
        '''

        # initialize all properties
        self.user = None
        self.id = None
        self.notes = None
        self.name = None
        self.natural_question = None
        self.nodes = [] # list of nodes
        self.edges = [] # list of edges
        self.hash = None

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

        self.hash = self.compute_hash()

        session = sessionmaker(bind=engine)
        s = session()
        s.add(self)
        self.commit()

    @staticmethod
    def dictionary_to_graph(dictionary):
        '''
        Convert struct from blackboards database to nodes and edges structs
        '''

        # add named node on the front (the first node must be named in order to build)
        query = Question.add_name_node_to_query(dictionary)
        if dictionary[-1]['nodeSpecType'] == 'Named Node':
            query = Question.add_name_node_to_query(query[::-1])[::-1]

        # convert to list of nodes (with conditions) as edges with lengths
        nodes = [dict(n, **{"id":i}) for i, n in enumerate(query)\
            if not n['nodeSpecType'] == 'Unspecified Nodes']
        edges = [dict(start=i-1, end=i, length=[query[i-1]['meta']['numNodesMin']+1, query[i-1]['meta']['numNodesMax']+1])\
            if i > 0 and query[i-1]['nodeSpecType'] == 'Unspecified Nodes'\
            else dict(start=i-1, end=i, length=[1])\
            for i, n in enumerate(query)\
            if i > 0 and not n['nodeSpecType'] == 'Unspecified Nodes']

        return nodes, edges

    def compute_hash(self):
        '''
        Generate an MD5 hash of the machine readable question interpretation
        i.e. the nodes and edges attributes
        '''

        json_spec = {
            "nodes":self.nodes,
            "edges":self.edges
        }
        m = hashlib.md5()
        m.update(json.dumps(json_spec).encode('utf-8'))
        return m.hexdigest()

    def __str__(self):
        return "<ROBOKOP Question id={}>".format(self.id)

    def toJSON(self):
        keys = [str(column).split('.')[-1] for column in self.__table__.columns]
        struct = {key:getattr(self, key) for key in keys}
        return struct

    def commit(self):
        Session.object_session(self).commit()

    def answer(self):
        '''
        Answer the question.

        Returns the answer struct, something along the lines of:
        https://docs.google.com/document/d/1O6_sVSdSjgMmXacyI44JJfEVQLATagal9ydWLBgi-vE
        '''

        # get all subgraphs relevant to the question from the knowledge graph
        database = KnowledgeGraph()
        subgraphs = database.query(self) # list of lists of nodes with 'id' and 'bound'
        answer_set_subgraph = database.getGraphByLabel(self.id)
        del database

        # compute scores with NAGA, export to json
        pr = ProtocopRank(answer_set_subgraph)
        score_struct, subgraphs = pr.report_scores_dict(subgraphs) # returned subgraphs are sorted by rank

        aset = AnswerSet(question_hash=self.compute_hash())
        for substruct, subgraph in zip(score_struct, subgraphs):
            graph = UniversalGraph(nodes=substruct['nodes'], edges=substruct['edges'])
            graph.merge_multiedges()
            graph.to_answer_walk(subgraph)

            node_ids = [node['id'] for node in graph.nodes]
            edge_ids = [edge['id'] for edge in graph.edges]
            answer = Answer(nodes=node_ids,\
                    edges=edge_ids,\
                    score=0)
            aset += answer #substruct['score'])

        return aset

    def cypher(self):
        '''
        Generate a Cypher query to extract the portion of the Knowledge Graph necessary to answer the question.

        Returns the query as a string.
        '''

        edge_types = ['Lookup' if n['nodeSpecType'] == 'Named Node' else 'Result' for n in self.nodes]
        edge_types.pop(1)

        node_count = len(self.nodes)
        edge_count = node_count-1

        # generate internal node and edge variable names
        node_names = ['n{:d}'.format(i) for i in range(node_count)]
        edge_names = ['r{0:d}{1:d}'.format(i, i+1) for i in range(edge_count)]

        # define bound nodes (no edges are bound)
        node_bound = [n['isBoundName'] for n in self.nodes]
        edge_bound = [False for e in range(edge_count)]

        node_conditions = []
        for node in self.nodes:
            node_conds = []
            if node['isBoundName']:
                node_conds += [[{'prop':'name', 'val':node['type']+'.'+node['label'], 'op':'=', 'cond':True},\
                    {'prop':'name', 'val':node['label'], 'op':'=', 'cond':True}]]
            if node['isBoundType']:
                node_conds += [[{'prop':'node_type', 'val':node['type'].replace(' ', ''), 'op':'=', 'cond':True}]]
            node_conditions += [node_conds]

        # generate MATCH command string to get paths of the appropriate size
        match_strings = ['MATCH '+'({}:{})'.format(node_names[0], self.id)]
        match_strings += ['MATCH '+'({})-'.format(node_names[i])+'[{0}:{2}*{3}..{4}]-({1})'.format(edge_names[i], node_names[i+1], edge_types[i], self.edges[i]['length'][0], self.edges[i]['length'][-1]) for i in range(edge_count)]
        with_strings = ['WITH DISTINCT '+', '.join(node_names[:i+1]) for i in range(edge_count)]

        # generate WHERE command string to prune paths to those containing the desired nodes/node types
        node_conditions = [
            [
                [
                    {
                        k:(c[k] if k != 'cond'\
            else '' if c[k]\
                        else 'NOT ')\
                        for k in c
                    } for c in d
                ] for d in conds
            ] for conds in node_conditions
        ]
        node_cond_strings = [['('+' OR '.join(['{0}{1}.{2}{3}\'{4}\''.format(c['cond'], node_names[i], c['prop'], c['op'], c['val'])\
            for c in d])+')'\
            for d in conds]\
            for i, conds in enumerate(node_conditions)]
        where_strings = ['WHERE '+' AND '.join(c) for c in node_cond_strings]
        big_string = match_strings[0]+' '+where_strings[0]+' '+' '.join([w+' '+m+' '+d for w, m, d in zip(with_strings, match_strings[1:], where_strings[1:])])
        
        # add bound fields and return map
        return_string = 'RETURN ['+', '.join(['{{id:{0}.id, bound:{1}}}'.format(n, 'True' if b else 'False') for n, b in zip(node_names, node_bound)])+'] as nodes'

        # return subgraphs matching query
        query_string = ' '.join([big_string, return_string])

        # print(query_string)
        return query_string
    
    @staticmethod
    def add_name_node_to_query(query):
        '''
        Adds name node to the beginning of a query
        based on the "label" specified in the leading "named node"
        '''

        first_node = query[0]
        name_type = 'NAME.DISEASE' if first_node['type'] == 'Disease' or first_node['type'] == 'Phenotype'\
            else 'NAME.DRUG' if first_node['type'] == 'Substance'\
            else 'idk'
        zeroth_node = {
            "id": "namenode",
            "nodeSpecType": "Named Node",
            "type": name_type,
            "label": first_node['label'],
            "isBoundName": True,
            "isBoundType": True,
            "meta": {
                "name": first_node['meta']['name']
            },
            "color": first_node['color']
        }
        first_node = {
            "id": first_node['id'],
            "nodeSpecType": "Node Type",
            "type": first_node['type'],
            "label": first_node['type'],
            "isBoundName": False,
            "isBoundType": True,
            "meta": {},
            "color": first_node['color']
        }
        return [zeroth_node, first_node] + query[1:]

def list_questions():
    session = sessionmaker(bind=engine)
    s = session()
    return s.query(Question).all()

def get_question_by_id(id):
    session = sessionmaker(bind=engine)
    s = session()
    return s.query(Question).filter(Question.id == id).first()