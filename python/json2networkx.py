import networkx as nx
import json
from collections import OrderedDict

def json2networkx_protocop(inThing):
    if isinstance(inThing, str):
        filename = inThing
        with open(filename) as data_file:
            data = json.load(data_file, object_pairs_hook=OrderedDict)
    else:
        data = inThing

    G = node_link_graph(data)
    
    # normalize graph data
    # 1. extract everything from "object" attribute (dict) into separate properties
    objects = nx.get_edge_attributes(G, 'object')
    edge_attrs = list(set([a for edge in objects for a in objects[edge]]))
    for attr in edge_attrs:
        vals = {edge:objects[edge][attr] if attr in objects[edge] else 'na' for edge in objects}
        nx.set_edge_attributes(G, values=vals, name=attr)

    # remove the attribute "object"
    edges = G.edges(data=True)
    for edge in edges:
        edge[2].pop('object')

    # compute weights, add as attribute
    pubs = nx.get_edge_attributes(G, 'publications')
    nx.set_edge_attributes(G, values={edge:(max(len(pubs[edge]),1) if isinstance(pubs[edge], list) else 1) for edge in pubs}, name='weight')
    edge_attrs += ['weight']

    # convert publications dicts to simple lists of pmids
    for edge in edges:
        if isinstance(edge[2]['publications'], list):
            edge[2]['publications'] = [int(p['id'][5:]) if 'id' in p else p['pmid'] for p in edge[2]['publications']]

    return G

from itertools import chain, count
from networkx.utils import make_str
__author__ = """Aric Hagberg <hagberg@lanl.gov>"""
__all__ = ['node_link_data', 'node_link_graph']

_attrs = dict(id='id', source='source', target='target', key='key')

def node_link_graph(data, directed=False, multigraph=True, attrs=_attrs):
    """Return graph from node-link data format.
    Parameters
    ----------
    data : dict
        node-link formatted graph data
    directed : bool
        If True, and direction not specified in data, return a directed graph.
    multigraph : bool
        If True, and multigraph not specified in data, return a multigraph.
    attrs : dict
        A dictionary that contains four keys 'id', 'source', 'target' and
        'key'. The corresponding values provide the attribute names for storing
        NetworkX-internal graph data. Default value:
        :samp:`dict(id='id', source='source', target='target', key='key')`.
    Returns
    -------
    G : NetworkX graph
       A NetworkX graph object
    Examples
    --------
    >>> from networkx.readwrite import json_graph
    >>> G = nx.Graph([(1,2)])
    >>> data = json_graph.node_link_data(G)
    >>> H = json_graph.node_link_graph(data)
    Notes
    -----
    The default value of attrs will be changed in a future release of NetworkX.
    See Also
    --------
    node_link_data, adjacency_data, tree_data
    """
    multigraph = data.get('multigraph', multigraph)
    directed = data.get('directed', directed)
    if multigraph:
        graph = nx.MultiGraph()
    else:
        graph = nx.Graph()
    if directed:
        graph = graph.to_directed()
    id_ = attrs['id']
    source = attrs['source']
    target = attrs['target']
    # Allow 'key' to be omitted from attrs if the graph is not a multigraph.
    key = None if not multigraph else attrs['key']
    mapping = []
    graph.graph = data.get('graph', {})
    c = count()
    for d in data['nodes']:
        d = d['id']
        d['id'] = d['identifier']
        node = d.get(id_, next(c))
        mapping.append(node)
        nodedata = dict((make_str(k), v) for k, v in d.items() if k != id_)
        graph.add_node(node, **nodedata) 
    for d in data['links']:
        src = d[source]
        tgt = d[target]
        if not multigraph:
            edgedata = dict((make_str(k), v) for k, v in d.items()
                            if k != source and k != target)
            graph.add_edge(mapping[src], mapping[tgt], **edgedata)
        else:
            ky = d.get(key, None)
            edgedata = dict((make_str(k), v) for k, v in d.items()
                            if k != source and k != target and k != key)
            graph.add_edge(mapping[src], mapping[tgt], ky, **edgedata)
    return graph