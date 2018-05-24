#!/usr/bin/env python

"""ROBOKOP manager layer"""

import os
import sys

import requests
from flask_restplus import Resource

from manager.setup import app, api
from manager.logging_config import logger
from manager.util import get_tasks, getAuthData
import manager.api.questions_api
import manager.api.q_api
import manager.api.a_api
import manager.api.feedback_api

class Tasks(Resource):
    def get(self):
        """
        Get list of tasks (queued and completed)
        ---
        tags: [tasks]
        responses:
            200:
                description: tasks
                type: array
                items:
                    $ref: '#/definitions/Task'
        """
        tasks = get_tasks()
        return tasks

api.add_resource(Tasks, '/tasks')

class TaskStatus(Resource):
    def get(self, task_id):
        """Get status for task
        ---
        tags: [tasks]
        parameters:
          - in: path
            name: task_id
            description: "task id"
            type: string
            required: true
        responses:
            200:
                description: task
                schema:
                    $ref: '#/definitions/Task'
        """
        # task = celery.AsyncResult(task_id)
        # return task.state

        flower_url = f'http://{os.environ["FLOWER_HOST"]}:{os.environ["FLOWER_PORT"]}/api/task/result/{task_id}'
        response = requests.get(flower_url, auth=(os.environ['FLOWER_USER'], os.environ['FLOWER_PASSWORD']))
        return response.json()

api.add_resource(TaskStatus, '/t/<task_id>')

class Concepts(Resource):
    def get(self):
        """
        Get known biomedical concepts
        ---
        tags: [util]
        responses:
            200:
                description: concepts
                type: array
                items:
                    type: string
        """
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/concepts")
        concepts = r.json()
        # bad_concepts =['NAME.DISEASE', 'NAME.PHENOTYPE', 'NAME.DRUG', "disease_or_phenotypic_feature", "biological_process_or_molecular_activity"]
        bad_concepts =['NAME.DISEASE', 'NAME.PHENOTYPE', 'NAME.DRUG']
        concepts = [c for c in concepts if not c in bad_concepts]
        concepts.sort()
        return concepts

api.add_resource(Concepts, '/concepts')

class Search(Resource):
    def get(self, term, category):
        """Look up biomedical search term using bionames service
        ---
        tags: [util]
        parameters:
          - in: path
            name: term
            description: "biomedical term"
            type: string
            required: true
          - in: path
            name: category
            description: "biomedical concept category"
            type: string
            required: true
        responses:
            200:
                description: "biomedical identifiers"
                type: array
                items:
                    type: string
        """
        url = f"https://bionames.renci.org/lookup/{term}/{category}/"
        r = requests.get(url)
        all_results = r.json()
        results = []
        for r in all_results:
            if not 'id' in r:
                continue
            if 'label' in r:
                r['label'] = r['label'] or r['id']
            elif 'desc' in r:
                r['label'] = r['desc'] or r['id']
                r.pop('desc')
            else:
                continue
            results.append(r)

        results = list({r['id']:r for r in all_results}.values())
        return results

api.add_resource(Search, '/search/<term>/<category>')

class User(Resource):
    def get(self):
        # perhaps don't document this because it's only used by the web GUI
        """
        Get current user info
        ---
        tags: [util]
        responses:
            200:
                description: user
                type: object
        """
        user = getAuthData()
        return user

api.add_resource(User, '/user')
