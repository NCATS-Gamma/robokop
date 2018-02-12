import time
from neo4j.v1 import GraphDatabase, basic_auth
from Question import Question
from Answer import Answer
from Graph import Graph

class Neo4jDatabase:

    def __init__(self, clientHost='127.0.0.1'):
        # connect to neo4j database
        clientHost = '127.0.0.1'
        self.driver = GraphDatabase.driver("bolt://"+clientHost+":7687", auth=basic_auth("python", "pyword"))
        print('Initialized driver.')
        self.session = self.driver.session()
        print('Started session.')
        self.json_suffix = '_json'
        print('Connected to database.')

    def getQueries(self):
        label_string = 'MATCH (n) RETURN distinct labels(n) as labels'
        result = list(self.session.run(label_string))
        non_query_labels = ['Type', 'Concept', 'fail']
        labels = [l for r in result if not any(i in r['labels'] for i in non_query_labels) for l in r['labels']]
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
        non_query_labels = ['Type', 'Concept', 'fail']
        labels = [l for r in result if not any(i in r['labels'] for i in non_query_labels) for l in r['labels']]
        return labels

    def getNodesByLabel(self, label):
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

        return Graph.n2n(result)


    def query(self, question):
        query_string = question.query()
        
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
