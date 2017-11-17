from neo4j.v1 import GraphDatabase, basic_auth
import os, json
import networkx as nx
from networkx.readwrite import json_graph

from queryManipulation import *

class Neo4jDatabase:

    def __init__(self):
        # connect to neo4j database
        self.driver = GraphDatabase.driver("bolt://localhost:7687", auth=basic_auth("python", "pyword"))
        self.session = self.driver.session()
        self.json_suffix = '_json'
        print('Connected to database.')

    def getLabels(self):
        result = list(self.session.run('MATCH (n) RETURN distinct labels(n) as labels'))
        non_query_labels = ['Type', 'Concept', 'fail']
        labels = [l for r in result if not any(i in r['labels'] for i in non_query_labels) for l in r['labels']]
        return labels

    def getNodesByLabel(self, label):
        match_string = 'MATCH (n:{})'.format(label)
        support_string = 'WITH collect(n) as nodes CALL apoc.path.subgraphAll(nodes, {maxLevel:0}) YIELD relationships as rels ' + \
            'UNWIND rels as r ' + \
            'WITH nodes, collect(r{.*, start:startNode(r).id, end:endNode(r).id, type:type(r), id:id(r)}) as rels ' + \
            'UNWIND nodes as n ' + \
            'WITH collect(n{.*}) as nodes, rels'
        return_string = 'RETURN nodes, rels'

        try:
            query_string = ' '.join([match_string, support_string, return_string])
            result = list(self.session.run(query_string))
            return self.neo4j2networkx(result)
        except:
            # the error above seems to close the database connection
            self.session = self.driver.session() # restart it
            count_string = 'RETURN length(nodes) as node_count, length(rels) as edge_count'
            query_string = ' '.join([match_string, support_string, count_string])
            result = list(self.session.run(query_string))
            result = {
                'node_count':result[0]['node_count'],
                'edge_count':result[0]['edge_count']
            }
            return(result)


    def query(self, input):
        if isinstance(input, str):
            # load query (as series of node and edge conditions) from json files
            # condition tuple format:
            # property name, comparison operator, property value, condition should be ____
            with open(os.path.join(input, 'query.json')) as infile:
                input = json.load(infile)

        if input[-1]['nodeSpecType'] == 'Named Node':
            query = addNameNodeToQuery(addNameNodeToQuery(input[::-1])[::-1])
        else:
            query = addNameNodeToQuery(input)

        # convert to list of nodes (with conditions) as edges with lengths
        nodes = [dict(n,**{'leadingEdge':query[i-1]['meta']})\
            if i>0 and query[i-1]['nodeSpecType']=='Unspecified Nodes'\
            else dict(n,**{'leadingEdge':{'numNodesMin':1,'numNodesMax':1}})\
            for i, n in enumerate(query)\
            if not n['nodeSpecType']=='Unspecified Nodes']

        node_count = len(nodes)
        edge_count = node_count-1

        # generate internal node and edge variable names
        node_names = ['n{:d}'.format(i) for i in range(node_count)]
        edge_names = ['r{0:d}{1:d}'.format(i,i+1) for i in range(edge_count)]

        # define bound nodes (no edges are bound)
        node_bound = [n['isBoundName'] for n in nodes]
        edge_bound = [False for e in range(edge_count)]

        node_conditions = []
        for n in nodes:
            node_conds = []
            if n['isBoundName']:
                node_conds += [{'prop':'name', 'val':n['label'], 'op':'=', 'cond':True}]
            if n['isBoundType']:
                node_conds += [{'prop':'node_type', 'val':n['type'].replace(' ',''), 'op':'=', 'cond':True}]
            node_conditions += [node_conds]

        # generate MATCH command string to get paths of the appropriate size
        match_string = 'MATCH '+'({})-'.format(node_names[0])+'-'.join(['[{0}]-({1})'.format(edge_names[i],node_names[i+1]) for i in range(edge_count)])

        # generate WHERE command string to prune paths to those containing the desired nodes/node types
        node_conditions = [[{k:(c[k] if k!='cond' else '' if c[k] else 'NOT ') for k in c} for c in conds] for conds in node_conditions]
        node_cond_strings = ['{0}{1}.{2}{3}\'{4}\''.format(c['cond'], node_names[i], c['prop'], c['op'], c['val']) for i, conds in enumerate(node_conditions) for c in conds]
        edge_cond_strings = ["type({0})='Result'".format(r) for r in edge_names]
        where_string = 'WHERE '+' AND '.join(node_cond_strings + edge_cond_strings)

        # get other edges connecting these nodes
        node_name_list = ', '.join(node_names)
        edge_name_list = ', '.join(edge_names)
        support_string = 'CALL apoc.path.subgraphAll(['+node_name_list+'], {maxLevel:0}) YIELD relationships '+\
        'WITH '+node_name_list+', '+edge_name_list+', [x in relationships WHERE not(x in ['+edge_name_list+']) | x{.*, bound:False, start:startNode(x).id, end:endNode(x).id, type:type(x), id:id(x)}] as supports '

        # add bound fields and return map
        return_string = support_string + 'RETURN ['+', '.join(['{0}{{.*, bound:{1}}}'.format(n, 'True' if b else 'False') for n, b in zip(node_names, node_bound)])+'] as nodes, '+\
        '['+', '.join(['{0}{{.*, bound:{1}, start:startNode({0}).id, end:endNode({0}).id, type:type({0}), id:id({0})}}'.format(e, 'True' if b else 'False') for e, b in zip(edge_names, edge_bound)])+'] as rels, '+\
        'supports'

        # return subgraphs matching query
        query_string = match_string + " " + where_string + " " + return_string
        result = self.session.run(query_string)

        records = [r for r in result]
        print("\n", len(records), "subgraphs returned.")
        return self.neo4j2networkx(records)

    def neo4j2networkx(self, records):
        # parse neo4j output into networkx graphs
        subgraphs = []
        for record in records:
            subgraph = nx.MultiDiGraph()
            mapr = {}
            for node in record["nodes"]:
                # use neo4j property 'id' (formerly networkx 'identifier') as networkx node id
                # keys = list(node.properties.keys())
                # attrs = {(k[:-5] if k[-5:]==self.json_suffix else k):(eval(node.properties[k]) if k[-5:]==self.json_suffix else node.properties[k]) for k in keys}
                subgraph.add_node(node['id'], **node)
            for edge in record["rels"]:
                subgraph.add_edge(edge['start'], edge['end'], **edge)
            if 'supports' in record:
                for edge in record["supports"]:
                    subgraph.add_edge(edge['start'], edge['end'], **edge)
            subgraphs += [subgraph]
        if len(subgraphs) > 0:
            G = subgraphs[0]
        else:
            G = nx.MultiDiGraph()

        for subgraph in subgraphs[1:]:
            G = nx.compose(G, subgraph)
        return G, subgraphs

    def __del__(this):
        this.session.close()
        print('Disconnected from database.')
