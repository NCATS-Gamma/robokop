"""A collection of utility function."""

from copy import deepcopy
def networkx2struct(graph):
    """Converts a networkX graph to a primitive dictionary with the
        necessary information for protocop-ui
    """
    return {'nodes': [nodeStruct(node) for node in graph.nodes(data=True)],
            'edges': [edgeStruct(edge) for edge in graph.edges(data=True)]}

def nodeStruct(node):
    props = deepcopy(node[-1])

    # rename node_type to type, adding if not present
    props['type'] = props.pop('node_type', [])

    return {**props,\
        'id':node[0]}

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