'''
Methods for querying database and manipulating resulting subgraphs
'''

import sys
from neo4jDatabase import Neo4jDatabase
from queryManipulation import nodeStruct, edgeStruct
sys.path.insert(0, '../robokop-rank')
from nagaProto import ProtocopRank

def queryAndScore(data):

    query = data['query']
    
    database = Neo4jDatabase()
    G = database.getNodesByLabel(data['board_id'])

    # query graph, neo4j to networkx subgraphs
    subgraphs = database.query(query, data['board_id']) # conditions lists
    del database

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

    max_results = 1000
    if len(score_struct)>max_results:
        return score_struct[:max_results]
    else:
        return score_struct

def constructName(ranking_data):
    ''' Construct short name summarizing each subgraph. '''
    names = []
    for node in ranking_data['nodes']:
        names.append(node['name'])

    short_name = ''
    for name_idx, name in enumerate(names):
        if name_idx > 0:
            #short_name = short_name + '→'
            short_name = short_name + ' » '
        short_name = short_name + name[0:min(len(name), 4)]

    return short_name

def mergeMultiEdges(edges):
    ''' Find edges between the same nodes and merge them. '''
    # expect edges in edgeStruct format
    # add weights
    # concatenate publications

    edge_list = set([(e['from'],e['to']) for e in edges])
    pruned = []
    for key in edge_list:
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