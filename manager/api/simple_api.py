'''
Blueprint for /api/simple/* endpoints
'''

import os
import sys
import json
import time
import re
from uuid import uuid4
import logging
from datetime import datetime
import requests
from flask import jsonify, request
from flask_security import auth_required
from flask_restful import Resource

from manager.setup import api
import manager.api.definitions2

logger = logging.getLogger(__name__)

view_storage_dir = f"{os.environ['ROBOKOP_HOME']}/uploads/"
if not os.path.exists(view_storage_dir):
    os.mkdir(view_storage_dir)

template_dir = f"{os.environ['ROBOKOP_HOME']}/robokop/queries"

output_formats = ['DENSE', 'MESSAGE', 'CSV', 'ANSWERS']

def parse_args_output_format(req_args):
    output_format = req_args.get('output_format', default=output_formats[1])
    if output_format.upper() not in output_formats:
        raise RuntimeError(f'output_format must be one of [{" ".join(output_formats)}]')
    
    return output_format

def parse_args_max_results(req_args):
    max_results = req_args.get('max_results', default=None)
    max_results = max_results if max_results is not None else 250
    return max_results

def parse_args_max_connectivity(req_args):
    max_connectivity = req_args.get('max_connectivity', default=None)
    
    if max_connectivity and isinstance(max_connectivity, str):
        if max_connectivity.lower() == 'none':
            max_connectivity = None
        else:
            try:
                max_connectivity = int(max_connectivity)
            except ValueError:
                raise RuntimeError(f'max_connectivity should be an integer')
            except:
                raise
            if max_connectivity < 0:
                max_connectivity = None

    return max_connectivity

def parse_args_rebuild(req_args):
    rebuild = request.args.get('rebuild', default='false')
    
    if not (rebuild.lower() in ['true', 'false']):
        raise RuntimeError(f'rebuild must be "true" or "false"')

    return rebuild.lower()

class Expand(Resource):
    def get(self, type1, id1, type2):
        """
        Expand out from a given node to another node type optionally along a particular predicate
        ---
        tags: [simple]
        parameters:
          - in: path
            name: type1
            description: "type of first node"
            schema:
                type: string
            required: true
            example: "disease"
          - in: path
            name: id1
            description: "curie of first node"
            schema:
                type: string
            required: true
            example: "MONDO:0005737"
          - in: path
            name: type2
            description: "type of second node"
            schema:
                type: string
            required: true
            example: "gene"
          - in: query
            name: predicate
            description: "edge predicate between the two nodes, also see direction"
            schema:
                type: string
            example: "disease_to_gene_association"
          - in: query
            name: direction
            description: "direction of the edge between the two nodes, can be one of out, in, undirected. The default is out meaning an edge from node_1 to node_2. This parameter only matters if predicate is also set."
            schema:
                type: string
            default: "out"
          - in: query
            name: rebuild
            schema:
                type: boolean
            default: false
          - in: query
            name: output_format
            description: Requested output format.
            schema:
                type: string
                enum:
                  - DENSE
                  - MESSAGE
                  - CSV
                  - ANSWERS
            default: MESSAGE
          - in: query
            name: max_connectivity
            description: Maximum number of edges into or out of nodes within the answer (0 for infinite, None for an adaptive procedure)
            schema:
                type: integer
            default: 0
          - in: query
            name: max_results
            description: Maximum number of results to return. Provide -1 to indicate no maximum.
            schema:
                type: integer
            default: 250
        responses:
            200:
                content:
                    application/json:
                        schema:
                            oneOf:
                              - description: Message
                                type: object
                              - description: Dense
                                type: object
                              - description: Answers
                                type: object
                    text/csv:
                        schema:
                            type: string
        """
        direction = request.args.get('direction', 'out')
        direction = direction.lower()
        if direction not in ['out', 'in', 'undirected']:
            return "Invalid direction parameter", 405

        if direction == 'in':
            source_id = 'n1'
            target_id = 'n0'
        else:
            source_id = 'n0'
            target_id = 'n1'

        directed = True
        if direction == 'undirected':
            directed = False
        question = {
            'machine_question': {
                'nodes': [
                    {
                        'id': 'n0', 
                        'curie': id1,
                        'type': type1
                    },
                    {
                        'id': 'n1',
                        'type': type2
                    }
                ],
                'edges': [
                    {
                        'id': 'e0',
                        'source_id': source_id,
                        'target_id': target_id,
                        'directed': directed
                    }
                ]
            }
        }
        logger.info('Running the expand service by a call to robokop/quick')
        
        predicate = request.args.get('predicate', default=None)
        if predicate is not None:
            question['machine_question']['edges'][0]['type'] = predicate

        max_results = parse_args_max_results(request.args)
        output_format = parse_args_output_format(request.args)
        max_connectivity = parse_args_max_connectivity(request.args)

        # Ger rebuild from request args
        question['rebuild'] = parse_args_rebuild(request.args)

        response = requests.post(
            f'http://manager:{os.environ["MANAGER_PORT"]}/api/simple/quick/?max_results={max_results}&max_connectivity={max_connectivity}&output_format={output_format}',
            json=question)
        answerset = response.json()

        return answerset

api.add_resource(Expand, '/simple/expand/<type1>/<id1>/<type2>/')

class Quick(Resource):
    def post(self):
        """
        Get answers to a question without caching
        ---
        tags: [simple]
        requestBody:
            name: question
            description: The machine-readable question graph.
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/Question'
            required: true
        parameters:
          - in: query
            name: rebuild
            schema:
                type: boolean
            default: false
          - in: query
            name: output_format
            description: Requested output format.
            schema:
                type: string
                enum:
                  - DENSE
                  - MESSAGE
                  - CSV
                  - ANSWERS
            default: MESSAGE
          - in: query
            name: max_connectivity
            description: Maximum number of edges into or out of nodes within the answer (0 for infinite, None for an adaptive procedure)
            schema:
                type: integer
            default: 0
          - in: query
            name: max_results
            description: Maximum number of results to return. Provide -1 to indicate no maximum.
            schema:
                type: integer
            default: 250
        responses:
            200:
                description: Message
                content:
                    application/json:
                        schema:
                            $ref: "#/definitions/Message"
        """
        logger.info('Answering question quickly')
        question = request.json
        
        possible_args = ['rebuild', 'output_format', 'max_connectivity', 'max_results']
        bad_args = [key for key in request.args.keys() if key not in possible_args]
        if bad_args:
            return f'Invalid parmeters provide {bad_args}. Valid parameters are {possible_args}', 400

        if not ('rebuild' in question):
            question['rebuild'] = parse_args_rebuild(request.args)

        if ('rebuild' in question) and (str(question['rebuild']).upper() == 'TRUE'):
            logger.info("   Rebuilding")
            response = requests.post(
                f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/',
                json=request.json
            )

            if not isinstance(response.json(), dict):
                logger.debug(f'Builder failure: {response.json()}')
                raise RuntimeError("The robokop knowledge graph builder could not correctly initiate the task.")

            builder_task_id = response.json()['task_id']
            logger.debug(f'   Builder acknowledged with task_id {builder_task_id}')
            polling_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{builder_task_id}"

            status_request_timedelay = 5 
            consecutive_failure_tolerance = 60 / status_request_timedelay # one minute
            consecutive_failures = 0
            for _ in range(60 * 60 * 3):  # wait up to 3 hour
                time.sleep(status_request_timedelay)
                response = requests.get(polling_url)
                logger.info(f'   Builder polled for status of builder task {builder_task_id}')
                if response.status_code == 200:
                    consecutive_failures = 0
                    if response.json()['status'] == 'FAILURE':
                        raise RuntimeError(f'Builder failed for task {builder_task_id}.')
                    if response.json()['status'] == 'REVOKED':
                        raise RuntimeError(f'Builder task {builder_task_id} was terminated.')
                    if response.json()['status'] == 'SUCCESS':
                        break
                else: 
                    # We didn't get a 200 during polling... this is bad
                    # We should probably assume that something has gone wrong
                    # But maybe not just yet
                    # Let's just not fail too many times in a row
                    consecutive_failures += 1
                    logger.warning(f'   Builder failed to give a good status ({consecutive_failures}) for {builder_task_id}, Response: {response.status_code}.')
                    if consecutive_failures > consecutive_failure_tolerance:
                        raise RuntimeError(f'The robokop knowledge graph builder failed to return a response reguarding the status of the builder task {builder_task_id}.')
            else:
                # We may want to cancel the builder task, but I think we should let it go.
                # It took a while, let it run, it will finish eventually.
                # builder_task_id
                raise RuntimeError("Knowledge source querying has not completed after 3 hours. Building will continue, after some time you may wish to try again without the rebuild option.")

            logger.info('   Done updating KG.')
        
        logger.info('   Answering question...')

        max_results = parse_args_max_results(request.args)
        output_format = parse_args_output_format(request.args)
        max_connectivity = parse_args_max_connectivity(request.args)

        logger.info('   Posting to Ranker...')
        response = requests.post(
            f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/?max_results={max_results}&output_format={output_format}&max_connectivity={max_connectivity}',
            json=question)

        if not isinstance(response.json(), dict):
            logger.debug(response.json())
            raise RuntimeError("The robokop ranker could not correctly initiate the task.")

        ranker_task_id = response.json()['task_id']
        logger.debug(f'   Ranker acknowledged with task_id {ranker_task_id}')
        polling_url = f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/task/{ranker_task_id}"

        status_request_timedelay = 5 
        consecutive_failure_tolerance = 60 / status_request_timedelay # one minute
        consecutive_failures = 0
        for _ in range(60 * 60 * 3):  # wait up to 3 hours
            time.sleep(status_request_timedelay)
            response = requests.get(polling_url)
            logger.info(f'   Ranker polled for status of ranker task {ranker_task_id}')
            # logger.info(response.text)
            if response.status_code == 200:
                consecutive_failures = 0
                if response.json()['status'] == 'FAILURE':
                    raise RuntimeError(f'Question answering failed. Ranker ID {ranker_task_id}.')
                if response.json()['status'] == 'REVOKED':
                    raise RuntimeError(f'Ranking task {ranker_task_id} was terminated.')
                if response.json()['status'] == 'SUCCESS':
                    break
            else: 
                # We didn't get a 200 during polling... this is bad
                # We should probably assume that something has gone wrong
                # But maybe not just yet
                # Let's just not fail too many times in a row
                consecutive_failures += 1
                logger.warning(f'   Ranker failed to give a good status ({consecutive_failures}) for {ranker_task_id}, Response: {response.status_code}.')
                if consecutive_failures > consecutive_failure_tolerance:
                    raise RuntimeError(f'The robokop ranker failed to return a response reguarding the status of the answering task {ranker_task_id}.')
        else:
            # We should cancel the ranker task, otherwise it will run for a long while and no one will listen to the answer.
            # ranker_task_id
            # To delete the ranker task we send a delete request to the polling_url
            response = requests.delete(polling_url)
            # We could check the response here, but there is nothing really that the user can do
            raise RuntimeError("Question answering has not completed after 3 hours. You may want to try with the non-blocking API.")

        answerset_json = requests.get(f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/task/{ranker_task_id}/result")
        logger.info('   Returning response')
        # logger.info(answerset_json)

        return answerset_json.json()

api.add_resource(Quick, '/simple/quick/')


class View(Resource):
    def post(self):
        """
        Upload an answerset for a question to view
        ---
        tags: [simple]
        requestBody:
            name: Answerset
            description: The machine-readable question graph.
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/Message'
                    examples:
                        yanked:
                            $ref: '#/definitions/ex_yanked'
            required: true
        responses:
            200:
                description: A URL for further viewing
                content:
                    text/plain:
                        schema:
                            type: string
        """
        
        logger.info('Recieving Answerset for storage and later viewing')
        message = request.json
        
        # Save the message to archive folder
        for _ in range(25):
            try:
                uid = str(uuid4())
                this_file = os.path.join(view_storage_dir, f'{uid}.json')
                with open(this_file, 'x') as answerset_file:
                    logger.info('Saving Message')
                    json.dump(message, answerset_file)
                break
            except:
                logger.info('Error encountered writting file. Retrying')
                pass
        else:
            logger.info('Error encountered writting file')
            return "Failed to save resource. Internal server error", 500
        
        return uid, 200

api.add_resource(View, '/simple/view/')

class ViewResources(Resource):
    def get(self, uid):
        """
        Retrieve a previously uploaded answerset
        ---
        tags: [simple]
        responses:
            200:
                description: A URL for further viewing
                application/json:
                        schema:
                            $ref: '#/components/schemas/Message'
            400:
                description: invalid uid
        """
        
        logger.info('Retrieving Answerset from storage')
        try:
            this_file = os.path.join(view_storage_dir, f'{uid}.json')
            if os.path.isfile(this_file):
                logger.info(f'Reading {this_file}')
                with open(this_file, 'r') as answerset_file:
                    answerset = json.load(answerset_file)
            else:
                return "ID not found", 400
        except:
            return "Error fetching data for ID", 500

        return answerset

api.add_resource(ViewResources, '/simple/view/<uid>/')


class Synonymize(Resource):
    def get(self, id1, type1):
        """
        Find synonymous identifiers for a given curie.
        ---
        tags: [simple]
        parameters:
          - in: path
            name: id1
            description: "curie of query node"
            schema:
                type: string
            required: true
            example: "MONDO:0005737"
          - in: path
            name: type1
            description: "type of query node"
            schema:
                type: string
            required: true
            example: "disease"
        responses:
            200:
                description: Synonymized node
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                id:
                                    type: string
                                name:
                                    type: string
                                synonyms:
                                    type: array
                                    items:
                                        type: string
                                type:
                                    type: string
        """
        logger.info('Synonymizing node')
        response = requests.post( f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/synonymize/{id1}/{type1}/' )
        if not response.ok:
            logger.info(f'   Failed to synonymize by calling the builder {response.status_code}: {response.text}')
            return response.text, response.status_code
        
        return response.json(), 200


api.add_resource(Synonymize, '/simple/synonymize/<id1>/<type1>/')

class SimilaritySearch(Resource):
    def get(self, type1, id1, type2, by_type):
        """
        Expand out from a given node to another node type optionally along a particular predicate
        ---
        tags: [simple]
        parameters:
          - in: path
            name: type1
            description: "type of query node"
            schema:
                type: string
            required: true
            example: "disease"
          - in: path
            name: id1
            description: "curie of query node"
            schema:
                type: string
            required: true
            example: "MONDO:0005737"
          - in: path
            name: type2
            description: "type of return nodes"
            schema:
                type: string
            required: true
            example: "disease"
          - in: path
            name: by_type
            description: "type used to evaluate similarity"
            schema:
                type: string
            required: true
            example: "phenotypic_feature"
          - in: query
            name: threshhold
            description: "Number between 0 and 1 indicating the minimum similarity to return"
            schema:
                type: float
            default: 0.5
          - in: query
            name: max_results
            description: "The maximum number of results to return. Set to 0 to return all results."
            schema:
                type: integer
            default: 250
          - in: query
            name: rebuild
            description: "Rebuild local knowledge graph for this similarity search"
            schema:
                type: boolean
            default: false
        responses:
            200:
                description: answers
                content:
                    application/json:
                        schema:
                            $ref: "#/definitions/SimilarityResult"
        """
        #TODO:Add another argument:
        #- in: query
        #  name: descendants
        #  description: "Include ontological descendants in the result"
        #  type: boolean
        #  default: false
        response = requests.post( f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/synonymize/{id1}/{type1}/' )
        sid1 = response.json()['id']

        rebuild = parse_args_rebuild(request.args)        
        
        if rebuild.upper()=='TRUE':
            try:
                question = {
                    'machine_question': {
                        'nodes': [
                            {
                                'id': 'n0',
                                'curie': sid1,
                                'type': type1
                            },
                            {
                                'id': 'n1',
                                'type': by_type
                            },
                            {
                                'id': 'n2',
                                'type': type2
                            },
                            {
                                'id': 'n3',
                                'type': by_type
                            }
                        ],
                        'edges': [
                            {
                                'source_id': 'n0',
                                'target_id': 'n1'
                            },
                            {
                                'source_id': 'n1',
                                'target_id': 'n2'
                            },
                            {
                                'source_id': 'n2',
                                'target_id': 'n3'
                            },
                        ]
                    }
                }
                response = requests.post( f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/', json=question)
                polling_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{response.json()['task_id']}"

                for _ in range(60 * 60):  # wait up to 1 hour
                    time.sleep(1)
                    response = requests.get(polling_url)
                    if response.status_code == 200:
                        if response.json()['status'] == 'FAILURE':
                            raise RuntimeError('Builder failed.')
                        if response.json()['status'] == 'REVOKED':
                            raise RuntimeError('Task terminated by admin.')
                        if response.json()['status'] == 'SUCCESS':
                                break
                    else: 
                        # We didn't get a 200 during polling... this is bad
                        # We should probably assume that something has gone wrong
                        raise RuntimeError('The robokop knowledge graph builder failed to return a response reguarding the status of the task.')
                else:
                    # We may want to cancel the builder task, but I think we should let it go.
                    # It took a while, let it run, it will finish eventually.
                    # builder_task_id
                    raise RuntimeError("Knowledge source querying has not completed after 1 hour. Building will continue, after some time in the future you may wish to try again without the rebuild option.")

                logger.info(f'Rebuild completed, status: {response.json()["status"]}')
            except Exception as e:
                logger.error(e)
        else:
            logger.info("No rebuild requested during similarity")

        #Now we're ready to calculate sim

        sim_params = {'threshhold':request.args.get('threshhold', default = None),
                      'max_results': parse_args_max_results(request.args)}
        sim_params = {k:v for k,v in sim_params.items() if v is not None}
        response = requests.get( f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/similarity/{type1}/{sid1}/{type2}/{by_type}', params=sim_params)

        return response.json()

api.add_resource(SimilaritySearch, '/simple/similarity/<type1>/<id1>/<type2>/<by_type>/')

class EnrichedExpansion(Resource):
    def post(self, type1, type2 ):
        """
        Expand out from a given node to another node type optionally along a particular predicate
        ---
        tags: [simple]
        parameters:
          - in: path
            name: type1
            description: "type of query node"
            schema:
                type: string
            required: true
            example: "disease"
          - in: path
            name: type2
            description: "type of return nodes"
            schema:
                type: string
            required: true
            example: "phenotypic_feature"
        requestBody:
            name: all_the_things
            description: "This should probably be a schema object"
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            threshhold:
                                description: "Number between 0 and 1 indicating the minimum similarity to return"
                                type: number
                                default: 0.5
                            max_results:
                                description: "The maximum number of results to return. Set to 0 to return all results."
                                type: integer
                                default: 100
                            identifiers:
                                description: "The entities being enriched"
                                type: array
                                items:
                                    type: string
                                required: true
                            include_descendants:
                                description: "Extend the starting entities to use all of their descendants as well"
                                type: boolean
                                default: false
                            numtype1:
                                type: integer
                                description: "The total number of entities of type 1 that exist. By default uses a value based on querying the cache"
                            rebuild:
                                description: "Rebuild local knowledge graph for this similarity search"
                                type: boolean
                                default: false
                        example:
                            threshhold: 0.5
                            max_results: 100
                            identifiers: ["MONDO:0005147", "MONDO:0005148"]
                            include_descendants: false
                            rebuild: false
        responses:
            200:
                description: return nodes
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    id:
                                        type: string
                                    name:
                                        type: string
                                    p:
                                        type: number
        """
        parameters = request.json
        identifiers = parameters['identifiers']
        normed_identifiers = set()
        for id1 in identifiers:
            response = requests.post( f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/synonymize/{id1}/{type1}/' )
            normed_identifiers.add(response.json()['id'])
        if 'include_descendants' in parameters and parameters['include_descendants']:
            self.add_descendants(normed_identifiers)
        if 'rebuild' in parameters and parameters['rebuild']:
            for normed_id in normed_identifiers:
                try:
                    question = {
                        'machine_question': {
                            'nodes': [
                                {
                                    'id': 'n0',
                                    'curie': normed_id,
                                    'type': type1
                                },
                                {
                                    'id': 'n1',
                                    'type': type2
                                },
                                {
                                    'id': 'n2',
                                    'type': type1
                                }
                            ],
                            'edges': [
                                {
                                    'source_id': 'n0',
                                    'target_id': 'n1'
                                },
                                {
                                    'source_id': 'n1',
                                    'target_id': 'n2'
                                }
                            ]
                        }
                    }
                    response = requests.post( f'http://{os.environ["BUILDER_HOST"]}:{os.environ["BUILDER_PORT"]}/api/', json=question)
                    polling_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{response.json()['task_id']}"

                    for _ in range(60 * 60):  # wait up to 1 hour
                        time.sleep(1)
                        response = requests.get(polling_url)
                        if response.status_code == 200:
                            if response.json()['status'] == 'FAILURE':
                                raise RuntimeError('Builder failed.')
                            if response.json()['status'] == 'REVOKED':
                                raise RuntimeError('Task terminated by admin.')
                            if response.json()['status'] == 'SUCCESS':
                                break
                        else: 
                            # We didn't get a 200 during polling... this is bad
                            # We should probably assume that something has gone wrong
                            raise RuntimeError('The robokop knowledge graph builder failed to return a response reguarding the status of the task.')
                    else:
                        # We may want to cancel the builder task, but I think we should let it go.
                        # It took a while, let it run, it will finish eventually.
                        # builder_task_id
                        raise RuntimeError("Knowledge source querying has not completed after 1 hour. Building will continue, after some time in the future you may wish to try again without the rebuild option.")
                        

                    logger.info(f'Rebuild completed, status {response.json()["status"]}')
                except Exception as e:
                    logger.error(e)
            else:
                logger.info("No rebuild")

        #Now we've updated the knowledge graph if demanded.  We can do the enrichment.
        if 'threshhold' in parameters:
            threshhold = parameters['threshhold']
        else:
            threshhold = 0.05
        if 'max_results' in parameters:
            maxresults = parameters['max_results']
        else:
            maxresults = 100
        if 'num_type1' in parameters:
            num_type1 = parameters['num_type1']
        else:
            num_type1 = None
        params = {'identifiers':list(normed_identifiers),
                  'threshhold':threshhold,
                  'max_results':maxresults,
                  'num_type1':num_type1}
        response = requests.post( f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/enrichment/{type1}/{type2}',json=params)
        return response.json()

    def add_descendants(self,identifiers):
        descendants = set()
        for ident in identifiers:
            response = requests.get( f'https://onto.renci.org/descendants/{ident}' ).json()
            descendants.update(response['descendants'])
        identifiers.update(descendants)

api.add_resource(EnrichedExpansion, '/simple/enriched/<type1>/<type2>/')

def list_templates():
    template_jsons = [f.replace('.json','').lower() for f in os.listdir(template_dir) if os.path.isfile(os.path.join(template_dir, f)) and '.json' in f]
    template_jsons.sort()
    return template_jsons

def load_and_complete_template(template_id, **kwargs):
    template_file = os.path.join(template_dir, template_id.lower() + '.json')
    if not os.path.isfile(template_file):
        logger.info(f'Invalid template_id {template_id}')
        raise Exception(f'Invalid template_id {template_id}')

    with open(template_file, 'r') as template_fid:
        template = template_fid.read()

    if kwargs is not None:
        for key in kwargs:
            if f'${key}$' not in template:
                logger.info(f'template string {key} is not used in template {template_id}')
                raise Exception(f'template string {key} is not used in template {template_id}')
            template = template.replace(f'${key}$', kwargs[key])
    
    return template
class Templates(Resource):
    def get(self):
        """
        Return a list of available templates.
        ---
        tags: [simple]
        responses:
            200:
                description: concepts
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: string
        """
        templates = list_templates()
        return templates
    
api.add_resource(Templates, '/simple/templates/')

class Template(Resource):
    def get(self, template_id):
        """
        Return an optionally completed template
        ---
        tags: [simple]
        parameters:
          - in: path
            name: template_id
            description: "The id for the template to be filled in. See /simple/templates"
            schema:
                type: string
            required: true
            example: "expand"
          - in: query
            name: arguments
            schema:
                type: object
            style: form
            explode: true
            example:
                identifier1: "MONDO:0005737"
                name1: "Ebola hemorrhagic fever"
                type2: "gene"
        responses:
            200:
                description: A machine question
                content:
                    application/json:
                        schema:
                            $ref: "#/definitions/Question"
        """

        kwargs = {
            key: request.args[key]
            for key in request.args
        }
        try:
            question = load_and_complete_template(template_id, **kwargs)
        except Exception as e:
            return str(e), 404

        return json.loads(question), 200

api.add_resource(Template, '/simple/template/<template_id>/')


class TemplateRun(Resource):
    def get(self, template_id):
        """
        Answer a templated questions.
        ---
        tags: [simple]
        parameters:
          - in: path
            name: template_id
            description: "The id for the template to be filled in. See /simple/templates"
            schema:
                type: string
            required: true
            example: "expand"
          - in: query
            name: arguments
            schema:
                type: object
            style: form
            explode: true
            example:
                identifier1: "MONDO:0005737"
                name1: "Ebola hemorrhagic fever"
                type2: "gene"
          - in: query
            name: rebuild
            description: Request a rebuild of the knowledge graph specifically for this question
            schema:
                type: boolean
            default: false
          - in: query
            name: output_format
            description: Requested output format
            schema:
                type: string
                enum:
                  - DENSE
                  - MESSAGE
                  - CSV
                  - ANSWER
            default: MESSAGE
          - in: query
            name: max_connectivity
            description: Maximum number of edges into or out of nodes within the answer (0 for infinite, None for an adaptive procedure)
            schema:
                type: integer
            default: 0
          - in: query
            name: max_results
            description: Maximum number of results to return. Provide -1 to indicate no maximum.
            schema:
                type: integer
            default: 250

        responses:
            200:
                description: answers
                content:
                    application/json:
                        schema:
                            $ref: "#/definitions/Message"
        """
        logger.info(f'Quick Template - {template_id}')

        quick_args = ['output_format', 'rebuild', 'max_connectivity', 'max_results']
        kwargs = {
            key: request.args[key]
            for key in request.args if key not in quick_args
        }
    
        try:
            question_text = load_and_complete_template(template_id, **kwargs)
        except Exception as e:
            return str(e), 404

        question = json.loads(question_text)
        
        max_results = parse_args_max_results(request.args)
        output_format = parse_args_output_format(request.args)
        max_connectivity = parse_args_max_connectivity(request.args)

        # Ger rebuild from request args
        question['rebuild'] = parse_args_rebuild(request.args)

        logger.info('Running completed templated response using quick')
        response = requests.post(
            f'http://manager:{os.environ["MANAGER_PORT"]}/api/simple/quick/?max_results={max_results}&max_connectivity={max_connectivity}&output_format={output_format}',
            json=question)
        if response.status_code >= 300:
            return "Bad response from the question answering service. " + response.text, response.status_code
        
        answerset = response.json()

        return answerset

api.add_resource(TemplateRun, '/simple/quick/template/<template_id>/')



class Normalize(Resource):
    def post(self):
        """
        Normalize answers to a message format with common identifiers
        ---
        tags: [simple]
        requestBody:
            name: message
            description: The machine-readable message
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/Message'
            required: true
        """
        logger.info('Normalizing answerset')
        provided = request.json
        if not provided:
            logger.info('   Invalid JSON input')
            return 'JSON post data is required', 400

        response = requests.post( f'http://{os.environ["RANKER_HOST"]}:{os.environ["RANKER_PORT"]}/api/normalize', json=provided)
        if not response.ok:
            logger.info(f'   Failed to normalize by calling the ranker {response.status_code}: {response.text}')
            return response.text, response.status_code
        
        return response.json, 200

api.add_resource(Normalize, '/simple/normalize/')
