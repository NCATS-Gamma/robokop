#!/usr/bin/env python

"""ROBOKOP manager layer"""

import os
import sys
import json
import time

import requests
from flask import request, Response
from flask_restful import Resource, abort
import redis

from manager.setup import app, api
from manager.logging_config import logger
from manager.util import getAuthData
from manager.tasks import celery, fetch_pubmed_info
from manager.task import get_task_by_id, TASK_TYPES, save_task_result, save_revoked_task_result
from manager.setup_db import engine


concept_map = {}
try:
    with app.open_resource('api/concept_map.json') as map_file:
        concept_map = json.load(map_file)
        logger.warning('Successfully read concept_map.json')
except Exception as e:
    logger.error(
        'misc_api.py:: Could not '
        f'find/read concept_map.json - {e}')

class TaskStatus(Resource):
    def get(self, task_id):
        """Get status for task
        ---
        tags: [tasks]
        parameters:
          - in: path
            name: task_id
            description: "task id"
            schema:
                type: string
            required: true
        responses:
            200:
                description: task
                content:
                    application/json:
                        schema:
                            $ref: '#/definitions/Task'
        """
        
        try:
            task = get_task_by_id(task_id)
        except:
            return 'Task not found', 404

        return task

    def delete(self, task_id):
        """Revoke task
        ---
        tags: [tasks]
        parameters:
          - in: path
            name: task_id
            description: "task id"
            schema:
                type: string
            required: true
        responses:
            204:
                description: task revoked
                content:
                    text/plain:
                        schema:
                            type: string
        """
        
        try:
            task = get_task_by_id(task_id)
        except:
            return 'No such task', 404

        try:
            celery.control.revoke(task_id, terminate=True)
        except Exception as err:
            return 'We failed to revoke the task', 500

        # We have a valid task in celery, we need to find the task in sql
        # try:
            # Update its stored status to deleted
        save_revoked_task_result(task_id)

        # If it's a ranker task, we will find it and delete it
        # If it's a builder task, let's just let it go
        task = get_task_by_id(task_id)
        request_url = ''
        if task['type'] == TASK_TYPES['answer']:
            request_url = f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/task/{task['remote_task_id']}"
            response = requests.delete(request_url)
                # We could check the reponses, but there is nothing we would tell the user either way
            # elif task['type'] == TASK_TYPES['update']:
            #     request_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{task['remote_task_id']}/log"
            # else: 
            #     raise Exception('Invalid task type')
        # except:
        #     return 'Task not found', 404

        return '', 204

api.add_resource(TaskStatus, '/t/<task_id>/')

class NLP(Resource):
    def post(self):
        """
        Parse Question
        ---
        tags: [util]
        summary: "Convert a natural-language question into machine-readable form."
        consumes:
          - text/plain
        requestBody:
            name: "question"
            description: "Natural-language question"
            required: true
            content:
                text/plain:
                    schema:
                        type: string
                        example: "What genes affect Ebola?"
        responses:
            200:
                description: "Here's your graph"
                content:
                    application/json:
                        schema:
                            $ref: "#/definitions/Graph"
            400:
                description: "Something went wrong"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        response = requests.post(f"http://{os.environ['NLP_HOST']}:{os.environ['NLP_PORT']}/api/parse/", data=request.get_data())
        return Response(response.content, response.status_code)

api.add_resource(NLP, '/nlp/')

class Concepts(Resource):
    def get(self):
        """
        Get known biomedical concepts
        ---
        tags: ["util - builder"]
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
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/concepts")
        concepts = r.json()
        bad_concepts =['NAME.DISEASE', 'NAME.PHENOTYPE', 'NAME.DRUG']
        concepts = [c for c in concepts if not c in bad_concepts]
        concepts.sort()

        return concepts

api.add_resource(Concepts, '/concepts/')


class Licenses(Resource):
    def get(self):
        """
        Get source licenses from knowledge sources
        ---
        tags: [util]
        responses:
            200:
                description: Licenses
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    name:
                                        type: string
                                        example: Drugbank
                                    url:
                                        type: string
                                        example: https://www.drugbank.ca/
                                    license:
                                        type: string
                                        example: CC-BY-NC-4.0
                                    license_url:
                                        type: string
                                        example: https://www.drugbank.ca/releases/latest
                                    citation_url:
                                        type: string
                                        example: https://www.drugbank.ca/about
        """
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/sourceLicenses")
        licenses = r.json()

        return licenses

api.add_resource(Licenses, '/licenses/')


class Omnicorp(Resource):
    def get(self, id1, id2):
        """
        Get publications for a pair of identifiers
        ---
        tags: ["util - ranker"]
        parameters:
          - in: path
            name: id1
            description: "curie of first term"
            schema:
                type: string
            required: true
            example: "MONDO:0005737"
          - in: path
            name: id2
            description: "curie of second term"
            schema:
                type: string
            required: true
            example: "HGNC:7897"
        responses:
            200:
                description: publications
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: string
        """

        r = requests.get(f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/omnicorp/{id1}/{id2}")
        return r.json()

api.add_resource(Omnicorp, '/omnicorp/<id1>/<id2>/')


class Omnicorp1(Resource):
    def get(self, id1):
        """
        Get publications for one identifier
        ---
        tags: ["util - ranker"]
        parameters:
          - in: path
            name: id1
            description: "curie of first term"
            schema:
                type: string
            required: true
            example: "MONDO:0005737"
        responses:
            200:
                description: publications
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: integer
        """

        r = requests.get(f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/omnicorp/{id1}")
        return r.json()

api.add_resource(Omnicorp1, '/omnicorp/<id1>/')


class Connections(Resource):
    def get(self):
        """
        Get possible connections between biomedical concepts
        ---
        tags: ["util - builder"]
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
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/connections")
        connections = r.json()

        return connections

api.add_resource(Connections, '/connections/')
    
class Operations(Resource):
    def get(self):
        """
        Get a machine readable list of all connections between biomedical concepts with sources
        ---
        tags: ["util - builder"]
        responses:
            200:
                description: concepts
                content:
                    application/json:
                        schema:
                            type: object
                            additionalProperties:
                                type: object
                                additionalProperties:
                                    type: array
                                    items:
                                        type: object
                                        properties:
                                            link:
                                                type: string
                                            op:
                                                type: string
        """
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/operations")
        operations = r.json()

        return operations

api.add_resource(Operations, '/operations/')

class Predicates(Resource):
    def get(self):
        """
        Get a machine readable list of all predicates for a source-target pair
        ---
        tags: ["util - builder"]
        responses:
            200:
                description: predicates
                content:
                    application/json:
                        schema:
                            description: Source map
                            type: object
                            additionalProperties:
                                description: Target map
                                type: object
                                additionalProperties:
                                    description: Array of predicates
                                    type: array
                                    items:
                                        type: string
        """
        get_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/predicates"
        r = requests.get(get_url)
        predicates = r.json()

        return predicates

    def post(self):
        """
        Force update of source-target predicate list from neo4j database
        ---
        tags: ["util - builder"]
        responses:
            200:
                description: "Here's your updated source-target predicate list"
                content:
                    application/json:
                        schema:
                            description: Source map
                            type: object
                            additionalProperties:
                                description: Target map
                                type: object
                                additionalProperties:
                                    description: Array of predicates
                                    type: array
                                    items:
                                        type: string
            400:
                description: "Something went wrong. Old predicate list will be retained"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        post_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/predicates"
        logger.debug(f'Predicates:post:: Trying to post to: {post_url}')
        response = requests.post(post_url)
        return Response(response.content, response.status_code)

api.add_resource(Predicates, '/predicates/')

class NodeProperties(Resource):
    def get(self):
        """
        Get a JSON object of properties for each node type
        ---
        tags: ["util - builder"]
        responses:
            200:
                description: node properties
                content:
                    application/json:
                        schema:
                            type: object
                            additionalProperties:
                                type: array
                                items:
                                    type: string
        """
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/node_properties")
        props = r.json()

        return props

    def post(self):
        """
        Force update of node-type property list from neo4j database
        ---
        tags: ["util - builder"]
        responses:
            200:
                description: "Here's your updated node-type property list"
                content:
                    application/json:
                        schema:
                            type: object
                            additionalProperties:
                                type: array
                                items:
                                    type: string
            400:
                description: "Something went wrong. Old node-type properties list will be retained"
                content:
                    text/plain:
                        schema:
                            type: string
        """
        post_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/node_properties"
        response = requests.post(post_url)
        return Response(response.content, response.status_code)

api.add_resource(NodeProperties, '/node_properties/')

class Properties(Resource):
    def get(self):
        """
        Get a machine readable list of potential node proeprties in the knowledge graph
        ---
        tags: ["util - builder"]
        responses:
            200:
                description: concepts
                content:
                    application/json:
                        schema:
                            type: object
                            additionalProperties:
                                type: object
                                properties:
                                    node_type:
                                        type: string
                                    prefixes:
                                        type: array
                                        items:
                                            type: string
                                additionalProperties:
                                    type: object
                                    properties:
                                        url:
                                            type: string
                                        keys:
                                            type: object
                                            additionalProperties:
                                                type: object
                                                properties:
                                                    source:
                                                        type: string
                                                    data_type:
                                                        type: string
        """
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/properties")
        props = r.json()

        return props

api.add_resource(Properties, '/properties/')

class Pubmed(Resource):
    def get(self, pmid):
        """
        Get pubmed publication from id
        ---
        tags: [util]
        parameters:
          - in: path
            name: pmid
            description: ID of pubmed publication
            schema:
                type: string
            required: true
            example: "10924274"
        responses:
            200:
                description: pubmed publication
                content:
                    application/json:
                        schema:
                            type: object
        """
        
        # logger.debug(f'Fetching pubmed info for pmid {pmid}')

        pubmed_redis_client = redis.Redis(
            host=os.environ['PUBMED_CACHE_HOST'],
            port=os.environ['PUBMED_CACHE_PORT'],
            db=os.environ['PUBMED_CACHE_DB'],
            password=os.environ['PUBMED_CACHE_PASSWORD'])

        pubmed_cache_key = f'robokop_pubmed_cache_{pmid}'
        pm_string = pubmed_redis_client.get(pubmed_cache_key)
        if pm_string is None:
            # logger.debug(f'Pubmed info for {pmid} not found in cache. Fetching from pubmed')

            result = fetch_pubmed_info.apply_async(
                args=[pmid, pubmed_cache_key]
            )
            
            try:
                task_status = result.get() # Blocking call to wait for task completion
            except Exception as err:
                # Celery/Redis is sometimes weird
                # You might think this would catch all of your errors
                #      (redis.exceptions.InvalidResponse, redis.exceptions.ConnectionError)
                # But it won't, there are like 3 other types of exceptions that happen here stochastically
                # There appears to be some sort of race condition with the task finishing quickly
                # and the polling done inside of result.get() and the redis results db
                return "Celery results is bad: " + str(err), 500
            
            if task_status != 'cached':
                return task_status, 500
            
            pm_string = pubmed_redis_client.get(pubmed_cache_key)
            if pm_string is None:
                return 'Pubmed info could not be found', 500
        
        pubmed_info = json.loads(pm_string)
        # logger.debug(f'Pubmed info for {pmid} found in cache.')
        
        return pubmed_info, 200

api.add_resource(Pubmed, '/pubmed/<pmid>/')

def search_request(term, node_type=None):
    results = []
    error_status = {'isError': False}

    if node_type:
        url = f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/entity_lookup/{node_type}"
    else:
        url = f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/entity_lookup"
    r = requests.post(url, data=term)
    if r.ok:
        results = r.json()
    else:
        error_status['isError'] = True
        error_status['code'] = r.status_code

    return sorted(results, reverse=True, key=lambda x: x['degree']), error_status

class Search(Resource):
    def post(self):
        """
        Look up biomedical identifiers from common names using robokop kg
        ---
        tags: [util]
        requestBody:
            name: "term"
            description: "search term"
            required: true
            content:
                text/plain:
                    schema:
                        type: string
                    examples:
                        ebola:
                            summary: "Find the identifier for ebola"
                            value: "ebola"
                        cog:
                            summary: "Find anything containing 'cog'"
                            value: "cog"
        responses:
            200:
                description: "biomedical identifiers"
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    curie:
                                        type: string
                                    name:
                                        type: string
                                    connections:
                                        type: object
        """
        term = request.get_data()
        results, error_status = search_request(term, node_type=None)

        if not results and error_status['isError']:
            abort(error_status['code'], message=f"Ranker lookup endpoint returned {error_status['code']} error code")
        else:
            return results, 200

api.add_resource(Search, '/search')

class SearchType(Resource):
    def post(self, node_type):
        """
        Look up biomedical identifiers from common names using robokop kg filtering by type
        ---
        tags: [util]
        parameters:
          - in: path
            name: node_type
            description: type of search term of interest
            schema:
                type: string
            required: true
            example: "disease"
        requestBody:
            name: "term"
            description: "search term"
            required: true
            content:
                text/plain:
                    schema:
                        type: string
                    examples:
                        ebola:
                            summary: "Find the identifier for ebola"
                            value: "ebola"
        responses:
            200:
                description: "biomedical identifiers"
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    curie:
                                        type: string
                                    name:
                                        type: string
                                    connections:
                                        type: object
        """

        term = request.get_data()
        results, error_status = search_request(term, node_type=node_type)

        if not results and error_status['isError'] :
            abort(error_status['code'], message=f"Ranker lookup endpoint returned {error_status['code']} error code")
        else:
            return results, 200

api.add_resource(SearchType, '/search/<node_type>')

class User(Resource):
    def get(self):
        # perhaps don't document this because it's only used by the web GUI
        """
        Get current user info
        ---
        tags: [users]
        responses:
            200:
                description: user
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                is_authenticated:
                                    type: string
                                    example: true
                                is_active:
                                    type: string
                                    example: true
                                is_anonymous:
                                    type: string
                                    example: false
                                is_admin:
                                    type: string
                                    example: false
                                username:
                                    type: string
                                    example: me@mydomain.edu
        """
        user = getAuthData()

        return user

api.add_resource(User, '/user/')

class TaskLog(Resource):
    def get(self, task_id):
        """
        Get activity log for a task and logs of remote tasks associated with the task.
        ---
        tags: [tasks]
        parameters:
          - in: path
            name: task_id
            description: ID of task
            schema:
                type: string
            required: true
        responses:
            200:
                description: text
        """
        try:
            task = get_task_by_id(task_id)
        except KeyError:
            return 'Task ID not found', 404

        try:
            request_url = ''
            if task['type'] == TASK_TYPES['answer']:
                request_url = f"http://{os.environ['RANKER_HOST']}:{os.environ['RANKER_PORT']}/api/task/{task['remote_task_id']}/log"
            elif task['type'] == TASK_TYPES['update']:
                request_url = f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/task/{task['remote_task_id']}/log"
            else: 
                raise Exception('Invalid task type')
            response = requests.get(request_url)
            remote_log = response.content.decode('utf-8')
            remote_log = remote_log.replace('\\n','\n') # Undo new line escaping, else it will happen twice
            remote_log = remote_log.replace('\\\\','\\') # Undo slashing
            remote_log = remote_log.replace('\\"','"') # Undo quotation escaping

             # Remove surrounding quotes
            first_quote = remote_log.find('"')
            last_quote = remote_log.rfind('"')
            if first_quote >= 0 and last_quote >= 0:
                remote_log = remote_log[(first_quote+1):last_quote]
        except:
            remote_log = 'Error fetching log file.'

        try:
            local_log_file = os.path.join(os.environ['ROBOKOP_HOME'], 'logs', 'manager_task_logs', f'{task_id}.log')
            if os.path.isfile(local_log_file):
                with open(local_log_file, 'r') as log_file:
                    local_log = log_file.read()
            else:
                local_log = ''
        except:
            local_log = 'Error fetching log file.'

        result = {
            'manager_task_id': task['id'],
            'remote_task_id': task['remote_task_id'],
            'task_type': task['type'],
            'task_log': local_log,
            'remote_task_log': remote_log
        }
        return result, 200
            

api.add_resource(TaskLog, '/t/<task_id>/log/')