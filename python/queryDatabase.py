import os
from neo4jDatabase import Neo4jDatabase
from nagaProto import ProtocopRank
import json
import networkx as nx
from queryManipulation import *

def queryAndScore(data):

    query = data['query']
    
    database = Neo4jDatabase()
    G = database.getNodesByLabel(data['board_id'])
    #   query = addNameNodeToQuery(query)
    
    d = Neo4jDatabase()
    
    # query graph, neo4j to networkx subgraphs
    subgraphs = d.query(query) # conditions lists
    del d
    
    # compute scores with NAGA, export to json
    pr = ProtocopRank(G)
    score_struct = pr.report_scores_dict(subgraphs)
    
    score_struct = list(map(lambda x: {\
        'nodes':[nodeStruct(node) for node in x['nodes']],\
        'edges':[edgeStruct(edge) for edge in x['edges']],\
        'score':x['score']},
        score_struct))
        
    for i in range(len(score_struct)):
        score_struct[i]['edges'] = mergeMultiEdges(score_struct[i]['edges'])
        score_struct[i]['info'] = {
            'name': constructName(score_struct[i])
        }

    max_results = 50
    if len(score_struct)>max_results:
        return score_struct[:max_results]
    else:
        return score_struct

def constructName(ranking_data):
    ''' Construct short name summarizing each subgraph. '''
    names = []
    for n in ranking_data['nodes']:
        names.append(n['name'])

    short_name = ''
    for iN, n in enumerate(names):
        if iN > 0:
            #short_name = short_name + '→'
            short_name = short_name + ' » '
        short_name = short_name + n[0:min(len(n),4)]

    return short_name

def mergeMultiEdges(edges):
    ''' Find edges between the same nodes and merge them. '''
    # expect edges in edgeStruct format
    # add weights
    # concatenate publications

    d = set([(e['from'],e['to']) for e in edges])
    pruned = []
    for key in d:
        edge_group = [e for e in edges if (e['from'], e['to']) == key]
        edge = mergeEdges(edge_group)
        pruned += [edge]
    return pruned

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
    return edge