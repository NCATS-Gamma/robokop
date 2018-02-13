from copy import deepcopy
import networkx as nx

class Graph:
    def __init__(self):
        self.edges = None
        self.nodes = None

    @staticmethod
    def n2n(records):
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
        for record in records:
            subgraph = self.n2n([record])
            subgraphs += [subgraph]
        if len(subgraphs) > 0:
            G = subgraphs[0]
        else:
            G = nx.MultiDiGraph()

        for subgraph in subgraphs[1:]:
            G = nx.compose(G, subgraph)
        return G, subgraphs

    @staticmethod
    def networkx2struct(graph):
        """Converts a networkX graph to a primitive dictionary with the
            necessary information for protocop-ui
        """
        return {'nodes': [Graph.nodeStruct(node) for node in graph.nodes(data=True)],
                'edges': [Graph.edgeStruct(edge) for edge in graph.edges(data=True)]}

    @staticmethod
    def nodeStruct(node):
        props = deepcopy(node[-1])

        # rename node_type to type, adding if not present
        props['type'] = props.pop('node_type', [])

        return {**props,\
            'id':node[0]}

    @staticmethod
    def edgeStruct(edge):
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

    @staticmethod
    def mergeMultiEdges(edges):
        ''' Find edges between the same nodes and merge them. '''
        # expect edges in edgeStruct format
        # add weights
        # concatenate publications

        edge_list = set([(e['from'],e['to']) for e in edges])
        pruned = []
        for key in edge_list:
            edge_group = [e for e in edges if (e['from'], e['to']) == key]
            edge = Graph.mergeEdges(edge_group)
            pruned += [edge]
        return pruned

    @staticmethod
    def mergeEdges(edges):
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