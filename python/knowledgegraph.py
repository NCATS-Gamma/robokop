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

    def getQueries(self):
        labels = self.getLabels()
        queries = []
        for label in labels:
            if label[:7] == 'Query1_':
                label_string = 'MATCH (n:{}) '.format(label)
                where_string = "WHERE n.node_type='NAME.DISEASE' "
                return_string = "RETURN n.name as disease"
                result = list(self.session.run(label_string+where_string+return_string))
            elif label[:7] == 'Query2_':
                label_string = 'MATCH (n:{}) '.format(label)
                where_string1 = "WHERE n.node_type='NAME.DISEASE' "
                return_string1 = "WITH n.name as disease "
                where_string2 = "WHERE n.node_type='NAME.DRUG' "
                return_string2 = "RETURN n.name as drug, disease "
                query_string = label_string+where_string1+return_string1+label_string+where_string2+return_string2
                result = list(self.session.run(query_string))
            elif label[:7] == 'Query2a':
                label_string = 'MATCH (n:{}) '.format(label)
                where_string1 = "WHERE n.node_type='NAME.DISEASE' "
                return_string1 = "WITH n.name as phenotype "
                where_string2 = "WHERE n.node_type='NAME.DRUG' "
                return_string2 = "RETURN n.name as drug, phenotype "
                query_string = label_string+where_string1+return_string1+label_string+where_string2+return_string2
                result = list(self.session.run(query_string))
            query = {k:result[0][k] for k in result[0]}
            if 'disease' in query and query['disease'][:13] == 'NAME.DISEASE.':
                query['disease'] = query['disease'][13:]
            if 'phenotype' in query and query['phenotype'][:13] == 'NAME.DISEASE.':
                query['phenotype'] = query['phenotype'][13:]
            if 'drug' in query and query['drug'][:10] == 'NAME.DRUG.':
                query['drug'] = query['drug'][10:]
            query['type'] = label.split('_')[0]
            query['id'] = label
            queries += [query]
        return queries

    def getLabels(self):
        result = list(self.session.run('MATCH (n) RETURN distinct labels(n) as labels'))
        non_query_labels = ['Type', 'Concept', 'fail'] + node_types.node_types
        labels = [l for r in result if not any(i in r['labels'] for i in non_query_labels) for l in r['labels']]
        return labels

    def getNodesByLabel(self, label):

        query_graph = self.getGraphByLabel(label)

        # Sometimes the grpah is too large and we get a summary dict
        # Usually though we get a networkx list
        if isinstance(query_graph, dict):
            graph = query_graph
        else:
            # Turn the networkx list into a struct for jsonifying
            graph = UniversalGraph(query_graph)
            graph = {'nodes': graph.nodes,
                     'edges': graph.edges}
            # TODO: this might not be used, and probably doesn't work

        return graph

    def getGraphByLabel(self, label):
            
        match_string = 'MATCH (n:{})'.format(label)
        return_string = 'RETURN [n{.*}] as nodes'
        query_string = ' '.join([match_string, return_string])
        print('Getting nodes by label... ', end='')
        result = list(self.session.run(query_string))

        match_string = 'MATCH (n:{})'.format(label)
        support_string = 'WITH collect(n) as nodes CALL apoc.path.subgraphAll(nodes, {maxLevel:0}) YIELD relationships as rels ' + \
            'UNWIND rels as r '
        return_string = 'RETURN [r{.*, start:startNode(r).id, end:endNode(r).id, type:type(r), id:id(r)}] as rels'
        query_string = ' '.join([match_string, support_string, return_string])
        print("Done.")
        result += list(self.session.run(query_string))
        query_graph = UniversalGraph.record2networkx(result)

        return query_graph


    def query(self, question):
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
