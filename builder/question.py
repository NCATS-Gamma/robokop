'''
Question definition
'''

# standard modules
import os
import sys
import json
import hashlib
import warnings

# our modules
from universalgraph import UniversalGraph
from knowledgegraph import KnowledgeGraph
from answer import Answer, Answerset

# robokop-rank modules
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-rank'))
from nagaProto import ProtocopRank

class Question():
    '''
    Represents a question such as "What genetic condition provides protection against disease X?"

    methods:
    * answer() - a struct containing the ranked answer paths
    * cypher() - the appropriate Cypher query for the Knowledge Graph
    '''

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
        for n in self.nodes:
            if n['nodeSpecType'] == 'Named Node':
                # identifiers = lookup_identifier(n['label'], n['type'], rosetta.core)
                identifiers = [n['meta']['identifier']]
                n['identifiers'] = identifiers
            else:
                n['identifiers'] = None

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

    def relevant_subgraph(self):
        # get the subgraph relevant to the question from the knowledge graph
        database = KnowledgeGraph()
        subgraph_networkx = database.queryToGraph(self.subgraph_with_support())
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
        answer_set_subgraph = database.queryToGraph(self.subgraph_with_support())
        del database

        # compute scores with NAGA, export to json
        pr = ProtocopRank(answer_set_subgraph)
        score_struct, subgraphs = pr.report_scores_dict(subgraphs) # returned subgraphs are sorted by rank

        aset = Answerset(question_hash=self.compute_hash())
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

    def cypher_match_string(self):

        nodes, edges = self.nodes, self.edges

        edge_types = ['Result' for e in edges]

        node_count = len(nodes)
        edge_count = len(edges)

        # generate internal node and edge variable names
        node_names = ['n{:d}'.format(i) for i in range(node_count)]
        edge_names = ['r{0:d}{1:d}'.format(i, i+1) for i in range(edge_count)]

        node_conditions = []
        for node in nodes:
            node_conds = []
            if 'identifiers' in node and node['identifiers']:
                node_conds.append([{'prop':'id', 'val':l, 'op':'=', 'cond':True} for l in node['identifiers']])
            if 'type' in node and node['type']:
                node_conds += [[{'prop':'node_type', 'val':node['type'].replace(' ', ''), 'op':'=', 'cond':True}]]
            node_conditions += [node_conds]

        # generate MATCH command string to get paths of the appropriate size
        match_strings = ['MATCH '+'({})'.format(node_names[0])]
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
        match_string = match_strings[0]+' '+where_strings[0]+' '+' '.join([w+' '+m+' '+d for w, m, d in zip(with_strings, match_strings[1:], where_strings[1:])])
        return match_string

    def cypher(self):
        '''
        Generate a Cypher query to extract the portion of the Knowledge Graph necessary to answer the question.

        Returns the query as a string.
        '''

        match_string = self.cypher_match_string()

        # generate internal node and edge variable names
        node_names = ['n{:d}'.format(i) for i in range(len(self.nodes))]
        edge_names = ['r{0:d}{1:d}'.format(i, i+1) for i in range(len(self.edges))]

        # define bound nodes (no edges are bound)
        node_bound = ['identifiers' in n and n['identifiers'] for n in self.nodes]
        node_bound = ["True" if b else "False" for b in node_bound]

        # add bound fields and return map
        answer_return_string = f"RETURN [{', '.join([f'{{id:{n}.id, bound:{b}}}' for n, b in zip(node_names, node_bound)])}] as nodes"

        # return subgraphs matching query
        query_string = ' '.join([match_string, answer_return_string])

        # print(query_string)
        return query_string

    def subgraph_with_support(self):
        match_string = self.cypher_match_string()

        # generate internal node and edge variable names
        node_names = ['n{:d}'.format(i) for i in range(len(self.nodes))]

        collection_string = f"WITH {'+'.join([f'collect({n})' for n in node_names])} as nodes" + "\n" + \
            "UNWIND nodes as n WITH collect(distinct n) as nodes"
        support_string = 'CALL apoc.path.subgraphAll(nodes, {maxLevel:0}) YIELD relationships as rels' + "\n" +\
            "WITH [r in rels | r{.*, start:startNode(r).id, end:endNode(r).id, type:type(r), id:id(r)}] as rels, nodes"
        return_string = 'RETURN nodes, rels'
        query_string = "\n".join([match_string, collection_string, support_string, return_string])

        return query_string

    def subgraph(self):
        match_string = self.cypher_match_string()

        # generate internal node and edge variable names
        node_names = ['n{:d}'.format(i) for i in range(len(self.nodes))]
        edge_names = ['r{0:d}{1:d}'.format(i, i+1) for i in range(len(self.edges))]

        # just return a list of nodes and edges
        collection_string = f"WITH {'+'.join([f'collect({e})' for e in edge_names])} as rels, {'+'.join([f'collect({n})' for n in node_names])} as nodes"
        unique_string = 'UNWIND nodes as n WITH collect(distinct n) as nodes, rels UNWIND rels as r WITH nodes, collect(distinct r) as rels'
        return_string = "\n".join([collection_string, unique_string, 'RETURN nodes, rels'])

        query_string = "\n".join([match_string, return_string])

        return query_string
