import os
from nagaProto import ProtocopRank
import json
import networkx as nx

def networkx2struct(graph):
    return {'nodes': [nodeStruct(node) for node in graph.nodes(data=True)],
            'edges': [edgeStruct(edge) for edge in graph.edges(data=True)]}

def nodeStruct(node):
    props = node[-1]
    nodeGood = {\
        'id':node[0],\
        'type':props['node_type'],\
        'name':props['name']}
    return nodeGood

def edgeStruct(edge):
    props = edge[-1]
    edgeGood = {\
        'to':edge[1],\
        'from':edge[0],\
        'reference':props['source'],\
        'function':props['function'],\
        'type':props['type'],\
        'id':props['id'],\
        'similarity':props['similarity'] if 'similarity' in props else [],\
        'publications':list(map(lambda x: int(x[5:]), props['pmids']))}
    if 'scoring' in props:
        edgeGood.update({'scoring':props['scoring']})
    return edgeGood

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