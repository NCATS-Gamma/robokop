from copy import deepcopy
import networkx as nx

class UniversalGraph:
    '''
    For now, this just encapsulates utilities for manipulating different graph forms:
    * Neo4j
    * networkx
    * JS object
    * ...
    '''

    def __init__(self, networkx_graph=None, nodes=None, edges=None):
        if networkx_graph is not None:
            nodes = networkx_graph.nodes(data=True)
            edges = networkx_graph.edges(data=True)
        self.edges = [self.edge_from_networkx(edge) for edge in edges]
        self.nodes = [self.node_from_networkx(node) for node in nodes]

    @staticmethod
    def record2networkx(records):
        graph = nx.MultiDiGraph()
        for record in records:
            if 'nodes' in record:
                for node in record["nodes"]:
                    graph.add_node(node['id'], **node)
            if 'rels' in record:
                for edge in record["rels"]:
                    graph.add_edge(edge['start'], edge['end'], **edge)
            if 'supports' in record:
                for edge in record["supports"]:
                    graph.add_edge(edge['start'], edge['end'], **edge)
        return graph

    @staticmethod
    def neo4j2networkx(records):
        # parse neo4j output into networkx graphs
        subgraphs = []
        if len(records)==0:
            G = nx.MultiDiGraph()
            return G, subgraphs

        for record in records:
            subgraph = UniversalGraph.record2networkx([record])
            subgraphs += [subgraph]
        
        G = subgraphs[0]
        for subgraph in subgraphs[1:]:
            G = nx.compose(G, subgraph)

        return G, subgraphs

    @staticmethod
    def node_from_networkx(node):
        props = deepcopy(node[-1])

        # rename node_type to type, adding if not present
        props['type'] = props.pop('node_type', [])

        return {**props,\
            'id':node[0]}

    @staticmethod
    def edge_from_networkx(edge):
        props = deepcopy(edge[-1])

        # rename source to reference, adding if not present
        props['reference'] = props.pop('source', [])

        # add similarity if not present
        if 'similarity' not in props:
            props['similarity'] = []

        # reformat pmids and rename to publications, adding if not present
        props['publications'] = list(map(lambda x: int(x[5:]), props.pop('pmids', [])))
        
        # add scoring if not present
        if 'scoring' not in props:
            props['scoring'] = []
        
        return {**props,\
            'to':edge[1],\
            'from':edge[0]}

    def merge_multiedges(self):
        ''' Find edges between the same nodes and merge them. '''
        # expect edges in edgeStruct format
        # add weights
        # concatenate publications

        edges = self.edges
        edge_list = set([(e['from'],e['to']) for e in edges])
        pruned = []
        for key in edge_list:
            edge_group = [e for e in edges if (e['from'], e['to']) == key]
            edge = UniversalGraph.merge_edges(edge_group)
            pruned += [edge]
        self.edges = pruned
        return self

    @staticmethod
    def merge_edges(edges):
        ''' Merge edges into a single edge. '''
        pubs = [e['publications'] for e in edges]
        pubs = [b for a in pubs for b in a] # flatten list
        types = [e['type'] for e in edges]
        references = [e['reference'] for e in edges]

        if 'Result' in types:
            edge = edges[types.index('Result')] # there should be at most one Result edge between any two nodes
        else:
            edge = edges[0]

        edge['publications'] = pubs
        edge['scoring']['num_pubs'] = len(pubs)
        # make sure we get chemotext2 similarity
        if 'chemotext2' in references:
            edge['similarity'] = edges[references.index('chemotext2')]['similarity']

        if 'cdw' in references:
            cdw_edge = edges[references.index('cdw')]
            edge['cdw'] = {'target_counts': cdw_edge['target_counts'],\
                        'shared_counts': cdw_edge['shared_counts'],\
                        'source_counts': cdw_edge['source_counts'],\
                        'expected_counts': cdw_edge['expected_counts']\
                        }
        else:
            edge['cdw'] = {}

        return edge