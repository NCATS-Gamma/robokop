'''
Blueprint for /api/flowbokop/* endpoints
'''

import os
import sys
import json
import time
import re
import logging
from datetime import datetime
import requests
from flask import jsonify, request
from flask_restful import Resource

from manager.setup import api
import manager.logging_config
from manager.flowbokop import CurieSet
from manager.flowbokop import Workflow

logger = logging.getLogger(__name__)

class FlowbokopUnion(Resource):
    def post(self):
        """
        A flowbokop service to union multiple curie lists
        ---
        tags: [flowbokop]
        requestBody:
            name: Flowbokop service input
            description: An object that specifes input curies and options
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                curies:
                                    type: array
                                    items:
                                        type: string
        """

        data = request.json
        in_curies = CurieSet(data['input'])
        out_curies = CurieSet.to_curie_list(in_curies.union())
        
        return out_curies

api.add_resource(FlowbokopUnion, '/flowbokop/union/')

class FlowbokopIntersect(Resource):
    def post(self):
        """
        A flowbokop service to intersect multiple curie lists
        ---
        tags: [flowbokop]
        requestBody:
            name: Flowbokop service input
            description: An object that specifes input curies and options
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                curies:
                                    type: array
                                    items:
                                        type: string
        """

        data = request.json
        in_curies = CurieSet(data['input'])
        out_curies = CurieSet.to_curie_list(in_curies.intersect())

        return out_curies

api.add_resource(FlowbokopIntersect, '/flowbokop/intersection/')

class FlowbokopExpand(Resource):
    def post(self, type1, type2):
        """
        Use flowbokop to expand out from a list of nodes of a given type to another node type optionally along a particular predicate
        ---
        tags: [flowbokop]
        parameters:
          - in: path
            name: type1
            description: "type of first node"
            schema:
                type: string
            required: true
            default: "disease"
          - in: path
            name: type2
            description: "type of second node"
            schema:
                type: string
            required: true
            default: "gene"
        requestBody:
            name: Flowbokop service input
            description: An object that specifes input curies and options
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                curies:
                                    type: array
                                    items:
                                        type: string
        """

        data = request.json
        in_curies = data['input']

        options = {}
        if 'options' in data:
            options = data['options']
        if not options:
            options = {}

        question = {
            'machine_question': {
                'nodes': [
                    {
                        'id': 'n0',
                        'curie': "input",
                        'set': True,
                        'type': type1
                    },
                    {
                        'id': 'n1',
                        'type': type2
                    }
                ],
                'edges': [
                    {
                        'source_id': 'n0',
                        'target_id': 'n1'
                    }
                ]
            }
        }
        
        if 'predicate' in options:
            question['machine_question']['edges'][0]['type'] = options['predicate']

        options['question'] = question

        post_data = {
            'input': in_curies,
            'options': options
        }

        response = requests.post(
            f'http://{os.environ["ROBOKOP_HOST"]}:{os.environ["MANAGER_PORT"]}/api/flowbokop/robokop/',
            json=post_data)
        if response.status_code < 300:
            output = response.json()
        else: 
            raise RuntimeError(response.text)

        return output

api.add_resource(FlowbokopExpand, '/flowbokop/expand/<type1>/<type2>/')

class FlowbokopSimilarity(Resource):
    def post(self, type1, type2, by_type):
        """
        Use robokop as a flowbokop service
        ---
        tags: [flowbokop]
        requestBody:
            name: Flowbokop service input
            description: An object that specifes input curies and options
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        parameters:
          - in: path
            name: type1
            description: "type of query node"
            schema:
                type: string
            required: true
            default: "disease"
          - in: path
            name: type2
            description: "type of return nodes"
            schema:
                type: string
            required: true
            default: "disease"
          - in: path
            name: by_type
            description: "type used to evaluate similarity"
            schema:
                type: string
            required: true
            default: "phenotypic_feature"
        responses:
            200:
                description: A curie list
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                curies:
                                    type: array
                                    items:
                                        type: string
        """

        data = request.json
        in_curies = CurieSet(data['input'])
        in_curies_list = CurieSet.to_curie_list(in_curies)

        options = data['options']
        # threshhold: "Number between 0 and 1 indicating the minimum similarity to return"
        #     type: float
        #     default: 0.5
        # maxresults: "The maximum number of results to return. Set to 0 to return all results."
        #     type: integer
        #     default: 100
        # csv
        #     type: boolean
        #     default: true
        # rebuild: "Rebuild local knowledge graph for this similarity search"
        #     type: boolean
        #     default: false

        out_curies = []
        for curie_dict in in_curies_list:
            url = f'http://{os.environ["ROBOKOP_HOST"]}:{os.environ["MANAGER_PORT"]}/api/simple/similarity/{type1}/{curie_dict["curie"]}/{type2}/{by_type}'
            option_string = [f'{key}={options[key]}' for key in options]
            if option_string:
                url += '?' + '&'.join(option_string)
            logger.debug(f"Calling robokop/similarity with {url}")

            response = requests.get(url)
            if response.status_code >= 300:
                raise RuntimeError(response.text)
            nodes = response.json()
            for node in nodes:
                curie_dict = {
                    "label": node['name'] if 'name' in node else '',
                    "curie": node['id']
                }
                out_curies.append(curie_dict)
        return out_curies

api.add_resource(FlowbokopSimilarity, '/flowbokop/similarity/<type1>/<type2>/<by_type>')


class FlowbokopEnrichment(Resource):
    def post(self, type1, type2):
        """
        Use robokop as a flowbokop service
        ---
        tags: [flowbokop]
        requestBody:
            name: Flowbokop service input
            description: An object that specifes input curies and options
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        parameters:
          - in: path
            name: type1
            description: "type of query node"
            schema:
                type: string
            required: true
            default: "disease"
          - in: path
            name: type2
            description: "type of return nodes"
            schema:
                type: string
            required: true
            default: "phenotypic_feature"
        responses:
            200:
                description: A curie list
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                curies:
                                    type: array
                                    items:
                                        type: string
        """

        data = request.json
        in_curies = CurieSet(data['input'])
        in_curies_list = CurieSet.to_curie_list(in_curies)

        data = data['options']
        # threshhold: "Number between 0 and 1 indicating the minimum similarity to return"
        #     type: float
        #     default: 0.5
        # maxresults: "The maximum number of results to return. Set to 0 to return all results."
        #     type: integer
        #     default: 100
        # include_descendants: "Extend the starting entities to use all of their descendants as well"
        #     type: boolean
        #     default: false
        # numtype1: "The total number of entities of type 1 that exist"
        #     default: Uses a value based on querying the cache
        # rebuild: "Rebuild local knowledge graph for this similarity search"
        #     type: boolean
        #     default: false

        out_curies = []
        data['identifiers'] = [n['curie'] for n in in_curies_list]
        url = f'http://{os.environ["ROBOKOP_HOST"]}:{os.environ["MANAGER_PORT"]}/api/simple/enriched/{type1}/{type2}'

        response = requests.post(url, json=data)
        if response.status_code >= 300:
            raise RuntimeError(response.text)
        nodes = response.json()
        for node in nodes:
            curie_dict = {
                "label": node['name'] if 'name' in node else '',
                "curie": node['id']
            }
            out_curies.append(curie_dict)
        return out_curies

api.add_resource(FlowbokopEnrichment, '/flowbokop/enrichment/<type1>/<type2>')

class FlowbokopRobokop(Resource):
    def post(self):
        """
        Use robokop as a flowbokop service
        ---
        tags: [flowbokop]
        requestBody:
            name: Flowbokop service input
            description: An object that specifes input curies and options
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                curies:
                                    type: array
                                    items:
                                        type: string
        """

        data = request.json
        in_curies = CurieSet(data['input'])
        in_curies_list = CurieSet.to_curie_list(in_curies)

        options = data['options']
        question = options['question']
        rebuild = False
        if 'rebuild' in options:
            rebuild = options['rebuild']
        if rebuild:
            question['rebuild'] = True
        for node in question['machine_question']['nodes']:
            if 'curie' in node and node['curie'] == 'input':
                node['curie'] = [c['curie'] for c in in_curies_list]

        response = requests.post(
            f'http://{os.environ["ROBOKOP_HOST"]}:{os.environ["MANAGER_PORT"]}/api/simple/quick/',
            json=question)
        if response.status_code < 300:
            answerset = response.json()
        else:
            raise RuntimeError(response.text)

        out_curies = []
        for answer in answerset['answers']:
            node = answer['nodes'][-1]
            curie_dict = {
                "label": node['name'] if 'name' in node else '',
                "curie": node['id']
            }
            out_curies.append(curie_dict)
        
        return out_curies

api.add_resource(FlowbokopRobokop, '/flowbokop/robokop/')


class Flowbokop(Resource):
    def post(self):
        """
        The Flowbokop service
        ---
        tags: [flowbokop]
        requestBody:
            name: Flowbokop service input
            description: An object that specifes input curies and options
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                curies:
                                    type: array
                                    items:
                                        type: string
        """

        data = request.json
        wf = Workflow(data)
        out_curies = wf.run()

        return out_curies

api.add_resource(Flowbokop, '/flowbokop/')



class FlowbokopGraph(Resource):
    def post(self):
        """
        The Computation Graph of the Flowbokop service
        ---
        tags: [flowbokop]
        requestBody:
            name: Flowbokop service input
            description: An object that specifes input curies and options
            content:
                application/json:
                    schema:
                        $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A graph representation of the operations to be conducted
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                curies:
                                    type: array
                                    items:
                                        type: string
        """

        data = request.json
        wf = Workflow(data)
        
        return wf.graph()

api.add_resource(FlowbokopGraph, '/flowbokop/graph/')
