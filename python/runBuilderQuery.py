"""Launches the Builder service"""
import sys
import json
import sqlite3
import logging
import userquery
from greent.rosetta import Rosetta
from builder import KnowledgeGraph
from greent.graph_components import KNode
from lookup_utils import lookup_disease_by_name, lookup_drug_by_name, lookup_phenotype_by_name
from userquery import UserQuery

def runBuilderQuery(database_file, board_id):
    """Given a board id, create a knowledge graph though querying external data sources.
       Export the graph to Neo4j.
       
       board_id may be a comma-separated list of board ids.
       e.g. asdfly,sdhjdhl,sdflch"""

    # initialize rosetta
    rosetta = Rosetta()

    board_ids = board_id.split(',')

    for board_id in board_ids:
        condition = "id='{}'".format(board_id)
        rows = fetch_table_entries(database_file, "building", condition)

        board_name = rows[0][1]
        board_description = rows[0][2]
        board_query = json.loads(rows[0][3])
        
        try:
            # convert query to the required form
            query = boardQueryToRenciQuery(board_query, rosetta)

            # build knowledge graph
            kgraph = KnowledgeGraph(query, rosetta)

            # get construction/source graph
            sgraph = getSourceGraph(kgraph)

            # export graph to Neo4j
            supports = ['chemotext']
            # supports = ['chemotext', 'chemotext2'] # chemotext2 is really slow
            exportBioGraph(kgraph, board_id, supports=supports)
        except:
            # Set flag in building table to indicated finsihed
            table_name = 'building'
            database = sqlite3.connect(database_file)
            cursor = database.cursor()
            # insert blackboard information into database
            cursor.execute('''UPDATE {}
                SET finished = ?
                WHERE {}'''.format(table_name, condition), ("Failed",))
            database.commit()
            database.close()
        
        # insert blackboard information into blackboards (indicating that it is finished)
        table_name = 'blackboards'
        database = sqlite3.connect(database_file)
        cursor = database.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS {}
                (id text, name text, description text, query_json text, con_graph text)'''\
                .format(table_name))
        # insert blackboard information into database
        cursor.execute("INSERT INTO {} VALUES (?,?,?,?,?)".format(table_name),\
            (board_id, board_name, board_description, json.dumps(board_query), json.dumps(sgraph)))
        database.commit()
        database.close()

        # Set flag in building table to indicated finsihed
        table_name = 'building'
        database = sqlite3.connect(database_file)
        cursor = database.cursor()
        # insert blackboard information into database
        cursor.execute('''UPDATE {}
            SET finished = ?
            WHERE {}'''.format(table_name, condition), ("True",))
        database.commit()
        database.close()
    
def fetch_table_entries(database, table, condition):
    """Helper function to grab a SQL Lite table entries"""
    conn = sqlite3.connect(database)
    cursor = conn.cursor()

    #####################################################################################################
    # Vulnerable to SQL injection. Hard to see why a user would want to do this since everything is open,
    # but by inserting code into the query name, for example, one could gain access to the database.
    cursor.execute('SELECT * FROM {} WHERE {}'.format(table, condition))
    #####################################################################################################

    rows = cursor.fetchall()
    conn.close()
    return rows

def boardQueryToRenciQuery(board_query, rosetta):
    if not board_query[0]['nodeSpecType'] == 'Named Node':
        raise TypeError('First node should be named.')
    board_query = [dict(n, **{'leadingEdge': board_query[i-1]['meta']})\
        if i > 0 and board_query[i-1]['nodeSpecType'] == 'Unspecified Nodes'\
        else dict(n, **{'leadingEdge': {'numNodesMin': 0, 'numNodesMax': 0}})\
        for i, n in enumerate(board_query)\
        if not n['nodeSpecType'] == 'Unspecified Nodes']
    two_sided = board_query[-1]['nodeSpecType'] == 'Named Node'

    begin, end = 0, -1
    ids = [None, None]
    for i in (begin, end):
        if board_query[i]['nodeSpecType'] == 'Named Node':
            lookup_fcn = lookup_disease_by_name if board_query[i]['type'] == 'Disease'\
                else lookup_phenotype_by_name if board_query[i]['type'] == 'Phenotype'\
                else lookup_drug_by_name if board_query[i]['type'] == 'Substance'\
                else None
            ids[i] = lookup_fcn(board_query[i]['label'], rosetta.core )
    # if len(disease_ids) == 0:
    #     sys.exit(1)
    start_name = board_query[0]['label']
    end_name = board_query[-1]['label']
    start_type = board_query[0]['type']
    end_type = board_query[-1]['type']
    def type2nametype(node_type):
        name_type = 'NAME.DISEASE' if node_type == 'Disease' or node_type == 'Phenotype' or node_type == 'GeneticCondition'\
            else 'NAME.DRUG' if node_type == 'Substance'\
            else None
        if not name_type:
            raise ValueError('Unsupported named node type.')
        return name_type
    start_name_type = type2nametype(start_type)
    end_name_type = type2nametype(end_type)
    start_name_node = KNode( '{}.{}'.format(start_name_type, start_name), start_name_type)
    end_name_node = KNode( '{}.{}'.format(end_name_type, end_name), end_name_type)
    query = UserQuery(ids[0], start_type, start_name_node)
    if two_sided:
        middlybits = board_query[1:-1]
    else:
        middlybits = board_query[1:]
    for transition in middlybits:
        query.add_transition(transition['type'].replace(' ', ''),\
            min_path_length=transition['leadingEdge']['numNodesMin']+1,\
            max_path_length=transition['leadingEdge']['numNodesMax']+1)
    if two_sided:
        query.add_transition(end_type, end_values = ids[-1])
        query.add_end_lookup_node(end_name_node)
    return query

def getSourceGraph(kgraph):
    # quickly grab the knowledge source graph
    cyphers = kgraph.userquery.generate_cypher()
    construction_graph = []
    for cypher in cyphers:
        programs = kgraph.rosetta.type_graph.db.query(cypher, data_contents=True)
        # programs = kgraph.rosetta.type_graph.get_transitions(cypher)
        # chain = programs[0]
        program = programs.rows[0]
        chain = program[0]
        for link in program[1:]:
            chain += link[1:]

        # something like this:
        """[{'iri': 'http://identifiers.org/name/disease', 'name': 'NAME.DISEASE'},
            {'op': 'tkba.name_to_doid', 'predicate': 'NAME_TO_ID', 'synonym': False, 'enabled': True},
            {'iri': 'http://identifiers.org/doid', 'name': 'DOID'},
            {'op': 'disease_ontology.doid_to_pharos', 'predicate': 'SYNONYM', 'synonym': True, 'enabled': True},
            {'iri': 'http://pharos.nih.gov/identifier/', 'name': 'PHAROS'},
            {'op': 'pharos.disease_get_gene', 'predicate': 'DISEASE_GENE', 'synonym': False, 'enabled': True},
            {'iri': 'http://identifiers.org/hgnc', 'name': 'HGNC'},
            {'op': 'biolink.gene_get_genetic_condition', 'predicate': 'GENE_TO_GENETIC_CONDITION', 'synonym': False, 'enabled': True},
            {'iri': 'http://identifiers.org/doid/gentic_condition', 'name': 'DOID.GENETIC_CONDITION'}]"""

        node_count = (len(chain)-1)/2
        edge_count = node_count + 1
        nodes = [{'id':n['name'],
            'name':n['name'],
            'type':n['iri']} for n in chain[::2]]
        edges = [{'from':chain[i*2]['name'],
            'to':chain[i*2+2]['name'],
            'reference':e['op'].split('.')[0],
            'function':e['op'].split('.')[1],
            'type':e['predicate'],
            'id':e['op'],
            'publications':''} for i, e in enumerate(chain[1::2])]
        # unique edges
        edges = {e['id']:e for e in edges}
        edges = [edges[k] for k in edges]
        construction_graph += [{
            'nodes': nodes,
            'edges': edges
        }]
    def uniqueDictByField(d, k):
        return list({e[k]:e for e in d}.values())
    construction_graph = {
        'nodes': uniqueDictByField([n for g in construction_graph for n in g['nodes']], 'id'),
        'edges': uniqueDictByField([e for g in construction_graph for e in g['edges']], 'id')
    }
    return construction_graph

def exportBioGraph(kgraph, result_name, supports=[]):
    logger = logging.getLogger('application')
    logger.setLevel(level = logging.DEBUG)

    kgraph.execute()
    kgraph.print_types()
    kgraph.prune()
    kgraph.enhance()
    kgraph.support(supports)
    kgraph.export(result_name)

if __name__ == "__main__":
    runBuilderQuery(*sys.argv[1:])
    print('Done.')