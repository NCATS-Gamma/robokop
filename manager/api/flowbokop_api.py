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
        parameters:
          - in: body
            name: Flowbokop service input
            description: An object that specifes input curies and options
            schema:
                $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                type: object
                properties:
                    curies:
                        type: array
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
        parameters:
          - in: body
            name: Flowbokop service input
            description: An object that specifes input curies and options
            schema:
                $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                type: object
                properties:
                    curies:
                        type: array
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
            type: string
            required: true
            default: "disease"
          - in: path
            name: type2
            description: "type of second node"
            type: string
            required: true
            default: "gene"
          - in: body
            name: Flowbokop service input
            description: An object that specifes input curies and options
            schema:
                $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                type: object
                properties:
                    curies:
                        type: array
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
                        'id': 0,
                        'curie': "input",
                        'set': True,
                        'type': type1
                    },
                    {
                        'id': 1,
                        'type': type2
                    }
                ],
                'edges': [
                    {
                        'source_id': 0,
                        'target_id': 1
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

class FlowbokopRobokop(Resource):
    def post(self):
        """
        Use robokop as a flowbokop service
        ---
        tags: [flowbokop]
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
        parameters:
          - in: body
            name: Flowbokop service input
            description: An object that specifes input curies and options
            schema:
                $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A curie list
                type: object
                properties:
                    curies:
                        type: array
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
        parameters:
          - in: body
            name: Flowbokop service input
            description: An object that specifes input curies and options
            schema:
                $ref: '#/definitions/FlowbokopServiceInput'
            required: true
        responses:
            200:
                description: A graph representation of the operations to be conducted
                type: object
                properties:
                    curies:
                        type: array
        """

        data = request.json
        wf = Workflow(data)
        
        return wf.graph()

api.add_resource(FlowbokopGraph, '/flowbokop/graph/')
