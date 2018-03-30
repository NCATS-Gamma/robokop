import os
import sys
import json
import hashlib
import warnings
from universalgraph import UniversalGraph
from knowledgegraph import KnowledgeGraph
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-rank'))
from nagaProto import ProtocopRank
from answer import Answer, AnswerSet, list_answersets_by_question_hash
from user import User
greent_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-interfaces')
builder_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-build', 'builder')
sys.path.insert(0, greent_path)
sys.path.insert(0, builder_path)
from greent import node_types
from builder import setup
from lookup_utils import lookup_identifier

from sqlalchemy.types import JSON
from sqlalchemy import Column, DateTime, String, Integer, Float, ForeignKey, func
from sqlalchemy.orm import relationship, backref

from setup import db
from logging_config import logger


class Question(db.Model):
    '''
    Represents a question such as "What genetic condition provides protection against disease X?"

    methods:
    * answer() - a struct containing the ranked answer paths
    * cypher() - the appropriate Cypher query for the Knowledge Graph
    '''

    __tablename__ = 'question'
    id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    natural_question = Column(String)
    notes = Column(String)
    name = Column(String)
    nodes = Column(JSON)
    edges = Column(JSON)
    name = Column(String)
    hash = Column(String)
    
    user = relationship(
        User,
        backref=backref('questions',
                        uselist=True,
                        cascade='delete,all'))

    def __init__(self, *args, **kwargs):
        '''
        keyword arguments: id, user, notes, natural_question, nodes, edges
        q = Question(kw0=value, ...)
        q = Question(struct, ...)
        '''

        # initialize all properties
        self.user_id = None
        self.id = None
        self.notes = None
        self.name = None
        self.natural_question = None
        self.name = None
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

        # replace input node names with identifiers
        rosetta = setup(os.path.join(greent_path,'greent','greent.conf'))
        for n in self.nodes:
            if n['nodeSpecType']=='Named Node':
                start_identifiers = lookup_identifier(n['label'], n['type'], rosetta.core)
                n['identifiers'] = start_identifiers

        self.hash = self.compute_hash()

        db.session.add(self)
        db.session.commit()

    @staticmethod
    def dictionary_to_graph(dictionary):
        '''
        Convert struct from blackboards database to nodes and edges structs
        '''

        query = dictionary

        # convert to list of nodes (with conditions) and edges with lengths
        nodes = [dict(n, **{"id":i}) for i, n in enumerate(query)\
            if not n['nodeSpecType'] == 'Unspecified Nodes']
        edges = [dict(start=i-1, end=i, length=[query[i-1]['meta']['numNodesMin']+1, query[i-1]['meta']['numNodesMax']+1])\
            if i > 0 and query[i-1]['nodeSpecType'] == 'Unspecified Nodes'\
            else dict(start=i-1, end=i, length=[1])\
            for i, n in enumerate(query)\
            if i > 0 and not n['nodeSpecType'] == 'Unspecified Nodes']

        return nodes, edges

    def answersets(self):
        return list_answersets_by_question_hash(self.hash)

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

    def relevant_subgraph(self):
        # get the subgraph relevant to the question from the knowledge graph
        database = KnowledgeGraph()
        subgraph_networkx = database.getGraphByLabel('q_'+self.hash)
        del database
        subgraph = UniversalGraph(subgraph_networkx)
        return {"nodes":subgraph.nodes,\
            "edges":subgraph.edges}

    def answer(self):
        '''
        Answer the question.

        Returns the answer struct, something along the lines of:
        https://docs.google.com/document/d/1O6_sVSdSjgMmXacyI44JJfEVQLATagal9ydWLBgi-vE
        '''
        
        # get all subgraphs relevant to the question from the knowledge graph
        database = KnowledgeGraph()
        subgraphs = database.query(self) # list of lists of nodes with 'id' and 'bound'
        answer_set_subgraph = database.getGraphByLabel('q_'+self.hash)
        del database

        # compute scores with NAGA, export to json
        pr = ProtocopRank(answer_set_subgraph)
        score_struct, subgraphs = pr.report_scores_dict(subgraphs) # returned subgraphs are sorted by rank

        aset = AnswerSet(question_hash=self.compute_hash())
        for substruct, subgraph in zip(score_struct, subgraphs):
            graph = UniversalGraph(nodes=substruct['nodes'], edges=substruct['edges'])
            graph.merge_multiedges()
            graph.to_answer_walk(subgraph)

            answer = Answer(nodes=graph.nodes,\
                    edges=graph.edges,\
                    score=substruct['score'])
            # TODO: move node/edge details to AnswerSet
            # node_ids = [node['id'] for node in graph.nodes]
            # edge_ids = [edge['id'] for edge in graph.edges]
            # answer = Answer(nodes=node_ids,\
            #         edges=edge_ids,\
            #         score=0)
            aset += answer #substruct['score'])

        return aset

    def cypher(self):
        '''
        Generate a Cypher query to extract the portion of the Knowledge Graph necessary to answer the question.

        Returns the query as a string.
        '''

        nodes, edges = self.nodes, self.edges

        edge_types = ['Result' for e in edges]

        node_count = len(nodes)
        edge_count = len(edges)

        # generate internal node and edge variable names
        node_names = ['n{:d}'.format(i) for i in range(node_count)]
        edge_names = ['r{0:d}{1:d}'.format(i, i+1) for i in range(edge_count)]

        # define bound nodes (no edges are bound)
        node_bound = [n['isBoundName'] for n in nodes]
        edge_bound = [False for e in range(edge_count)]

        node_conditions = []
        for node in nodes:
            node_conds = []
            if node['isBoundName']:
                node_conds.append([{'prop':'id', 'val':l, 'op':'=', 'cond':True} for l in node['identifiers']])
            if node['isBoundType']:
                node_conds += [[{'prop':'node_type', 'val':node['type'].replace(' ', ''), 'op':'=', 'cond':True}]]
            node_conditions += [node_conds]

        # generate MATCH command string to get paths of the appropriate size
        match_strings = ['MATCH '+'({}:{})'.format(node_names[0], 'q_'+self.hash)]
        match_strings += ['MATCH '+'({})-'.format(node_names[i])+'[{0}:{2}*{3}..{4}]-({1})'.format(edge_names[i], node_names[i+1], edge_types[i], edges[i]['length'][0], edges[i]['length'][-1]) for i in range(edge_count)]
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
    def add_name_nodes_to_query(nodes, edges):
        '''
        Adds name node to the beginning of a query
        based on the "label" specified in the leading "named node"
        '''

        max_id = max([n['id'] for n in nodes])

        new_nodes = []
        new_edges = edges
        for i, n in enumerate(nodes):
            if n['nodeSpecType'] == 'Named Node':
                name_type = 'NAME.DISEASE' if n['type'] == node_types.DISEASE or n['type'] == node_types.PHENOTYPE\
                    else 'NAME.DRUG' if n['type'] == node_types.DRUG\
                    else 'idk'
                max_id += 1
                zeroth_node = {
                    "id": max_id,
                    "nodeSpecType": "Named Node",
                    "type": name_type,
                    "label": n['label'],
                    "isBoundName": True,
                    "isBoundType": True,
                    "meta": {
                        "name": n['meta']['name']
                    },
                    "color": n['color']
                }
                first_node = {
                    "id": n['id'],
                    "nodeSpecType": "Node Type",
                    "type": n['type'],
                    "label": n['type'],
                    "isBoundName": False,
                    "isBoundType": True,
                    "meta": {},
                    "color": n['color']
                }
                new_edges += [{'start':max_id, 'end':n['id'], 'length':[1]}]
                new_nodes += [zeroth_node, first_node]
            else:
                new_nodes += [n]
        return new_nodes, new_edges

def list_questions():
    return db.session.query(Question).all()

def list_questions_by_hash(hash):
    return db.session.query(Question).filter(Question.hash == hash).all()

def list_questions_by_username(username, invert=False):
    if invert:
        return db.session.query(Question).join(Question.user).filter(User.username != username).all()
    else:
        return db.session.query(Question).join(Question.user).filter(User.username == username).all()

def list_questions_by_user_id(user_id, invert=False):
    if invert:
        return db.session.query(Question).filter(Question.user_id != user_id).all()
    else:
        return db.session.query(Question).filter(Question.user_id == user_id).all()

def get_question_by_id(id):
    return db.session.query(Question).filter(Question.id == id).first()