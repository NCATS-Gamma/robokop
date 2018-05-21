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

@api.route('/tasks')
class Tasks(Resource):
    @api.response(200, 'Success')
    def get(self):
        """Get list of tasks (queued and completed)"""
        tasks = get_tasks()
        return tasks

@api.route('/t/<task_id>')
@api.param('task_id', 'A task id')
class TaskStatus(Resource):
    @api.response(200, 'Success')
    def get(self, task_id):
        """Get status for task"""
        # task = celery.AsyncResult(task_id)
        # return task.state

        flower_url = f'http://{os.environ["FLOWER_HOST"]}:{os.environ["FLOWER_PORT"]}/api/task/result/{task_id}'
        response = requests.get(flower_url, auth=(os.environ['FLOWER_USER'], os.environ['FLOWER_PASSWORD']))
        return response.json()

@api.route('/concepts')
class Concepts(Resource):
    @api.response(200, 'Success')
    def get(self):
        """Get known biomedical concepts"""
        r = requests.get(f"http://{os.environ['BUILDER_HOST']}:{os.environ['BUILDER_PORT']}/api/concepts")
        concepts = r.json()
        # bad_concepts =['NAME.DISEASE', 'NAME.PHENOTYPE', 'NAME.DRUG', "disease_or_phenotypic_feature", "biological_process_or_molecular_activity"]
        bad_concepts =['NAME.DISEASE', 'NAME.PHENOTYPE', 'NAME.DRUG']
        concepts = [c for c in concepts if not c in bad_concepts]
        concepts.sort()
        return concepts

@api.route('/search/<term>/<category>')
class Search(Resource):
    @api.response(200, 'Success')
    def get(self, term, category):
        """Look up biomedical search term using bionames service"""
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

@api.route('/user')
class User(Resource):
    @api.response(200, 'Success')
    def get(self):
        """Get current user info"""
        user = getAuthData()
        return user
