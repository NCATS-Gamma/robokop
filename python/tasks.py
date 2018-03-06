import logging
import time
from setup import app, mail
from celery import Celery
from flask_mail import Message
from question import get_question_by_id
from flask_security.core import current_user

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-interfaces'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-build','builder'))
import userquery
from greent.rosetta import Rosetta
from builder import KnowledgeGraph
from greent.graph_components import KNode
from lookup_utils import lookup_disease_by_name, lookup_drug_by_name, lookup_phenotype_by_name
from userquery import UserQuery

# set up Celery
app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

# set up logger
logger = logging.getLogger("robokop")

@celery.task
def wait_and_email():
    logger.info("Waiting to email...")
    time.sleep(20)
    with app.app_context():
        msg = Message("ROBOKOP: Test",
                      sender="robokop@sandboxa74aec7033c545a6aa4e43bdf8271f0b.mailgun.org",
                      recipients=["patrick@covar.com"],
                      body="I'm in a subprocess.")
        mail.send(msg)

@celery.task
def answer_question(question_id):
    logger.info("Answering your question...")

    question = get_question_by_id(question_id)
    question.answer()
    user = question.user
    
    with app.app_context():
        msg = Message("ROBOKOP: Answers Ready",
                      sender="robokop@sandboxa74aec7033c545a6aa4e43bdf8271f0b.mailgun.org",
                      recipients=['patrick@covar.com'], #[user.email],
                      body="Your question answers are ready. <link>")
        mail.send(msg)

    logger.info("Done answering.")

@celery.task
def update_kg(question_id):
    logger.info("Updating the knowledge graph...")

    question = get_question_by_id(question_id)
    
    # initialize rosetta
    rosetta = Rosetta()
        
    try:
        # convert query to the required form
        query = questionToRenciQuery(question, rosetta)

        # build knowledge graph
        kgraph = KnowledgeGraph(query, rosetta)

        # get construction/source graph
        sgraph = getSourceGraph(kgraph)

        # export graph to Neo4j
        supports = ['chemotext']
        # supports = ['chemotext', 'chemotext2'] # chemotext2 is really slow
        exportBioGraph(kgraph, board_id, supports=supports)
        
    except Exception as err:
        logger.error(err)
    
    # send completion email
    with app.app_context():
        msg = Message("ROBOKOP: Knowledge Graph Update Complete",
                      sender="robokop@sandboxa74aec7033c545a6aa4e43bdf8271f0b.mailgun.org",
                      recipients=['patrick@covar.com'], #[user.email],
                      body="The knowledge graph has been updated with respect to your question. <link>")
        mail.send(msg)

    logger.info("Done updating.")


def questionToRenciQuery(question, rosetta):
    print(questions)
    if not board_query[0]['nodeSpecType'] == 'Named Node':
        raise TypeError('First node should be named.')
    # convert unspecified nodes to 'leadingEdge' property of subsequent nodes
    # add 0-node 'leadingEdge' where unspecified
    # remove unspecified nodes
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
    start_name_node = KNode( '{}.{}'.format(start_name_type, start_name), start_name_type)
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
        end_name_type = type2nametype(end_type)
        end_name_node = KNode( '{}.{}'.format(end_name_type, end_name), end_name_type)
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
        nodes = []
        edges = []
        for program in programs.rows:
            chain = program[0]

            # chain looks something like this:
            """[{'iri': 'http://identifiers.org/name/disease', 'name': 'NAME.DISEASE'},
                {'op': 'tkba.name_to_doid', 'predicate': 'NAME_TO_ID', 'synonym': False, 'enabled': True},
                {'iri': 'http://identifiers.org/doid', 'name': 'DOID'},
                {'op': 'disease_ontology.doid_to_pharos', 'predicate': 'SYNONYM', 'synonym': True, 'enabled': True},
                {'iri': 'http://pharos.nih.gov/identifier/', 'name': 'PHAROS'},
                {'op': 'pharos.disease_get_gene', 'predicate': 'DISEASE_GENE', 'synonym': False, 'enabled': True},
                {'iri': 'http://identifiers.org/hgnc', 'name': 'HGNC'},
                {'op': 'biolink.gene_get_genetic_condition', 'predicate': 'GENE_TO_GENETIC_CONDITION', 'synonym': False, 'enabled': True},
                {'iri': 'http://identifiers.org/doid/gentic_condition', 'name': 'DOID.GENETIC_CONDITION'}]"""

            nodes += [{'id':n['name'],
                'name':n['name'],
                'type':n['iri']} for n in chain[::2]]
            edges += [{'from':chain[i*2]['name'],
                'to':chain[i*2+2]['name'],
                'reference':e['op'].split('.')[0],
                'function':e['op'].split('.')[1],
                'type':e['predicate'],
                'id':e['op'],
                'publications':''} for i, e in enumerate(chain[1::2])]

        # unique nodes
        nodes = {n['id']:n for n in nodes}
        nodes = [nodes[k] for k in nodes]

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