"""Launches the Builder service"""

import time
import json
import sqlite3

# import userquery
# from queryDatabase import addNameNodeToQuery
# from builder import run_query
# from greent import node_types
# from greent.rosetta import Rosetta
# from builder import KnowledgeGraph

def runBuilderQuery(database_file, board_id):
    """Given a board id, create a knowledge graph though querying external data sources.
       Export the graph to Neo4j.
       
       board_id may be a comma-separated list of board ids.
       e.g. asdfly,sdhjdhl,sdflch"""

    # initialize rosetta
    # rosetta = Rosetta()

    if ',' in board_id:
        board_ids = board_id.split(',')
    else:
        board_ids = [board_id]

    for board_id in board_ids:
        condition = "id='{}'".format(board_id)
        rows = fetch_table_entries(database_file, "building", condition)

        board_name = rows[0][1]
        board_description = rows[0][2]
        board_query = json.loads(rows[0][3])
        print(board_name)
        print(board_description)
        print(board_query)

        # convert query to the required form
        # query = boardQueryToRenciQuery(board_query)

        # build knowledge graph
        # kgraph = KnowledgeGraph(query, rosetta)

        # get construction/source graph
        # sgraph = getSourceGraph(kgraph)
        sgraph = {'nodes': [], 'edges': []}

        # export graph to Neo4j
        result_name = board_id
        supports = ['chemotext', 'chemotext2'] # you can add chemotext2 here, but it's really slow

        time.sleep(15)

        # exportBioGraph(kgraph, result_name, supports=supports)
        
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
        cursor.execute("INSERT INTO {} VALUES (?,?,?,?,?)".format(table_name),\
            (board_id, board_name, board_description, json.dumps(board_query), "True"))
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

def boardQueryToRenciQuery(board_query):
    if not board_query[0]['nodeSpecType'] == 'Named Node':
        raise TypeError('First node should be named.')
    board_query = [dict(n, **{'leadingEdge': board_query[i-1]['meta']})\
        if i > 0 and board_query[i-1]['nodeSpecType'] == 'Unspecified Nodes'\
        else dict(n, **{'leadingEdge': {'numNodesMin': 0, 'numNodesMax': 0}})\
        for i, n in enumerate(board_query)\
        if not n['nodeSpecType'] == 'Unspecified Nodes']
    two_sided = board_query[-1]['nodeSpecType'] == 'Named Node'

    def buildOneSidedQuery(bq):
        bq = addNameNodeToQuery(bq)
        query = userquery.OneSidedLinearUserQuery(bq[0]['label'], bq[0]['type'].replace(' ', ''))
        for transition in bq[1:]:
            query.add_transition(transition['type'].replace(' ', ''),\
                min_path_length=transition['leadingEdge']['numNodesMin']+1,\
                max_path_length=transition['leadingEdge']['numNodesMax']+1)
        return query

    if two_sided:
        types = [n['type'] for n in board_query]
        if 'Anatomy' not in types:
            raise TypeError('Two-sided queries must contain an Anatomy node.')
        boundary = types.index('Anatomy')
        # TODO: this may break if the anatomy node is at either end
        lquery = buildOneSidedQuery(board_query[:boundary+1])
        rquery = buildOneSidedQuery(board_query[-1:boundary-1:-1])
        query = userquery.TwoSidedLinearUserQuery(lquery, rquery)
    else:
        query = buildOneSidedQuery(board_query)
    return query

def getSourceGraph(kgraph):
    # quickly grab the knowledge source graph
    cyphers = kgraph.userquery.generate_cypher()
    construction_graph = []
    for cypher in cyphers:
        programs = kgraph.rosetta.type_graph.db.query(cypher, data_contents=True)
        if not programs.rows:
            return None
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
        construction_graph += [{
            'nodes': nodes,
            'edges': edges
        }]
    def uniqueDictByField(d, k): return list({e[k]:e for e in d}.values())
    construction_graph = {
        'nodes': uniqueDictByField([n for g in construction_graph for n in g['nodes']], 'id'),
        'edges': [e for g in construction_graph for e in g['edges']]
    }
    return construction_graph

def exportBioGraph(kgraph, result_name, supports=[]):
    # now the actual graph builder
    kgraph.execute()
    kgraph.prune()
    kgraph.enhance()
    kgraph.support(supports)
    kgraph.export(result_name)

import zmq
class Communicator:
    #   Hello World client in Python
    #   Connects REQ socket to tcp://localhost:5555
    #   Sends "Hello" to server
    def __init__(self):
        context = zmq.Context()
        #  Socket to talk to server
        self.socket = context.socket(zmq.REQ)
        self.socket.connect("tcp://localhost:5555")

    def askFor(self, question):
        self.socket.send(question.encode('utf-8'))
        answer = self.socket.recv().decode('utf-8')
        answer = json.loads(answer) if question[-5:]=='_json' else answer
        return answer

    def sendStatus(self, message):
        self.socket.send(message.encode('utf-8'))
        # we have to get a reply, because that's how this kind of zmq socket works
        # there may be a better one to use for this purpose
        reply = self.socket.recv()

if __name__ == "__main__":
    runBuilderQuery(*sys.argv[1:])