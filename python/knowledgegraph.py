import time
import os
import sys
from neo4j.v1 import GraphDatabase, basic_auth
from universalgraph import UniversalGraph
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-interfaces'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'robokop-build', 'builder'))
from greent import node_types

class KnowledgeGraph:

    def __init__(self):
        # connect to neo4j database
        self.driver = GraphDatabase.driver("bolt://"+os.environ["NEO4J_HOST"]+":"+os.environ["NEO4J_BOLT_PORT"], auth=basic_auth("neo4j", os.environ["NEO4J_PASSWORD"]))
        print('Initialized driver.')
        self.session = self.driver.session()
        print('Started session.')
        self.json_suffix = '_json'
        print('Connected to database.')

    def queryToGraph(self, query_string):
        result = list(self.session.run(query_string))
        query_graph = UniversalGraph.record2networkx(result)

        return query_graph


    def query(self, question):
        if isinstance(question, str):
            query_string = question
        else:
            query_string = question.cypher()

        print('Running query... ', end='')
        start = time.time()
        result = self.session.run(query_string)
        records = [r['nodes'] for r in result]
        print(time.time()-start, 'seconds elapsed')

        print("\n", len(records), "subgraphs returned.")

        return records

    def __del__(self):
        self.session.close()
        print('Disconnected from database.')
