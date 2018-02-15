import os
import sys
import json
from UniversalGraph import UniversalGraph
from KnowledgeGraph import KnowledgeGraph
sys.path.insert(0, '../robokop-rank')
from nagaProto import ProtocopRank
from Answer import AnswerSet

class Question:
    '''
    Represents a question such as "What genetic condition provides protection against disease X?"

    methods:
    * answer() - a struct containing the ranked answer paths
    * cypher() - the appropriate Cypher query for the Knowledge Graph
    '''

    def __init__(self, dictionary, question_id):
        self.id = question_id
        self.dictionary = dictionary
        if isinstance(self.dictionary, str):
            # load query (as series of node and edge conditions) from json files
            # condition tuple format:
            # property name, comparison operator, property value, condition should be ____
            with open(os.path.join(self.dictionary, 'query.json')) as infile:
                self.dictionary = json.load(infile)

    def answer(self):
        '''
        Answer the question.

        Returns the answer struct, something along the lines of:
        https://docs.google.com/document/d/1O6_sVSdSjgMmXacyI44JJfEVQLATagal9ydWLBgi-vE
        '''

        # get all subgraphs relevant to the question from the knowledge graph
        database = KnowledgeGraph()
        subgraphs = database.query(self) # list of lists of nodes with 'id' and 'bound'
        G = database.getGraphByLabel(self.id)
        del database

        # compute scores with NAGA, export to json
        pr = ProtocopRank(G)
        score_struct = pr.report_scores_dict(subgraphs)

        out_struct = []
        for s in score_struct:
            graph = UniversalGraph(nodes=s['nodes'], edges=s['edges'])
        graph.merge_multiedges()
            out_struct += [
                {'nodes':graph.nodes,\
            'edges':graph.edges,\
                'score':s['score']},
                ]
        score_struct = out_struct

        for i in range(len(score_struct)):
            # score_struct[i]['edges'] = UniversalGraph.mergeMultiEdges(score_struct[i]['edges'])
            score_struct[i]['info'] = {
                'name': AnswerSet.constructName(score_struct[i])
            }

        max_results = 1000
        if len(score_struct)>max_results:
            return score_struct[:max_results]
        else:
            return score_struct

    def cypher(self):
        '''
        Generate a Cypher query to extract the portion of the Knowledge Graph necessary to answer the question.

        Returns the query as a string.
        '''

        if self.dictionary[-1]['nodeSpecType'] == 'Named Node':
            query = self.addNameNodeToQuery(self.addNameNodeToQuery(self.dictionary[::-1])[::-1])
        else:
            query = self.addNameNodeToQuery(self.dictionary)

        # convert to list of nodes (with conditions) as edges with lengths
        nodes = [dict(n,**{'leadingEdge':query[i-1]['meta']})\
            if i>0 and query[i-1]['nodeSpecType']=='Unspecified Nodes'\
            else dict(n,**{'leadingEdge':{'numNodesMin':1,'numNodesMax':1}})\
            for i, n in enumerate(query)\
            if not n['nodeSpecType']=='Unspecified Nodes']
        edge_types = ['Lookup' if n['nodeSpecType']=='Named Node' else 'Result' for n in nodes]
        edge_types.pop(1)

        node_count = len(nodes)
        edge_count = node_count-1

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
                node_conds += [[{'prop':'name', 'val':node['type']+'.'+node['label'], 'op':'=', 'cond':True},\
                    {'prop':'name', 'val':node['label'], 'op':'=', 'cond':True}]]
            if node['isBoundType']:
                node_conds += [[{'prop':'node_type', 'val':node['type'].replace(' ', ''), 'op':'=', 'cond':True}]]
            node_conditions += [node_conds]

        # generate MATCH command string to get paths of the appropriate size
        match_strings = ['MATCH '+'({}:{})'.format(node_names[0], self.id)]
        match_strings += ['MATCH '+'({})-'.format(node_names[i])+'[{0}:{2}]-({1})'.format(edge_names[i], node_names[i+1], edge_types[i]) for i in range(edge_count)]
        with_strings = ['WITH DISTINCT '+', '.join(node_names[:i+1]) for i in range(edge_count)]

        # generate WHERE command string to prune paths to those containing the desired nodes/node types
        node_conditions = [[[{k:(c[k] if k!='cond'\
            else '' if c[k]\
            else 'NOT ') for k in c}\
            for c in d]\
            for d in conds]
            for conds in node_conditions]
        node_cond_strings = [['('+' OR '.join(['{0}{1}.{2}{3}\'{4}\''.format(c['cond'], node_names[i], c['prop'], c['op'], c['val'])\
            for c in d])+')'\
            for d in conds]\
            for i, conds in enumerate(node_conditions)]
        where_strings = ['WHERE '+' AND '.join(c) for c in node_cond_strings]
        big_string = match_strings[0]+' '+where_strings[0]+' '+' '.join([m+' '+w+' '+d for m,w,d in zip(with_strings, match_strings[1:], where_strings[1:])])
        
        # add bound fields and return map
        return_string = 'RETURN ['+', '.join(['{{id:{0}.id, bound:{1}}}'.format(n, 'True' if b else 'False') for n, b in zip(node_names, node_bound)])+'] as nodes'

        # return subgraphs matching query
        query_string = ' '.join([big_string, return_string])
        return query_string
    
    @staticmethod
    def addNameNodeToQuery(query):

        firstNode = query[0]
        name_type = 'NAME.DISEASE' if firstNode['type'] == 'Disease' or firstNode['type'] == 'Phenotype'\
            else 'NAME.DRUG' if firstNode['type'] == 'Substance'\
            else 'idk'
        zerothNode = {
            "id": "namenode",
            "nodeSpecType": "Named Node",
            "type": name_type,
            "label": firstNode['label'],
            "isBoundName": True,
            "isBoundType": True,
            "meta": {
                "name": firstNode['meta']['name']
            },
            "leadingEdge": {
                'numNodesMin': 0,
                'numNodesMax': 0
            },
            "color": firstNode['color']
        }
        firstNode = {
            "id": firstNode['id'],
            "nodeSpecType": "Node Type",
            "type": firstNode['type'],
            "label": firstNode['type'],
            "isBoundName": False,
            "isBoundType": True,
            "meta": {},
            "leadingEdge": {
                'numNodesMin': 0,
                'numNodesMax': 0
            },
            "color": firstNode['color']
        }
        return [zerothNode, firstNode] + query[1:]
