import os
from nagaProto import ProtocopRank
import json
import networkx as nx

def networkx2struct(graph):
    return {'nodes': [nodeStruct(node) for node in graph.nodes(data=True)],
            'edges': [edgeStruct(edge) for edge in graph.edges(data=True)]}

def nodeStruct(node):
    props = node[-1]
    props['type'] = props['node_type']
    props.pop('node_type', None)
    return {**props,\
        'id':node[0]}

def edgeStruct(edge):
    props = edge[-1]

    # rename source to reference, adding if not present
    props['reference'] = props['source'] if 'source' in props else []
    props.pop('source', None)

    # add similarity if not present
    props['similarity'] = props['similarity'] if 'similarity' in props else []

    # reformat pmids and rename to publications, adding if not present
    props['publications'] = list(map(lambda x: int(x[5:]), props['pmids'])) if 'pmids' in props else []
    props.pop('pmids', None)

    # add scoring if not present
    props['scoring'] = props['scoring'] if 'scoring' in props else []
    
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