#!/usr/bin/env python

import os
import requests
import json

robokop_url = 'http://robokop.renci.org'
quick_url = f'{robokop_url}/api/simple/quick/'
view_post_url = f'{robokop_url}/api/simple/view/'
view_url = lambda uid: f'{robokop_url}/simple/view/{uid}'

if not os.path.isfile('./example_answerset.json'): 
    example_question = {
        "machine_question": {
            "edges": [
            {
                "source_id": "n0",
                "target_id": "n1"
            },
            {
                "source_id": "n1",
                "target_id": "n2"
            }
            ],
            "nodes": [
            {
                "curie": "MONDO:0005737",
                "id": "n0",
                "type": "disease"
            },
            {
                "id": "n1",
                "type": "gene"
            },
            {
                "id": "n2",
                "type": "genetic_condition"
            }
            ]
        },
        "name": "Ebola--(gene)--(genetic_condition)",
        "natural_question": "What genetic conditions might provide protection against Ebola?",
        "notes": "#ebola #q1"
    }

    quick_response = requests.post(quick_url, json=example_question)

    if quick_response.status_code >= 300:
        raise Exception("Bad response from quick")

    answerset = quick_response.json()

    with open('./example_answerset.json','w') as fid:
        json.dump(answerset, fid)

else:
    with open('./example_answerset.json','r') as fid:
        answerset = json.load(fid)


view_post_response = requests.post(view_post_url, json=answerset)

if view_post_response.status_code >= 300:
    print(view_post_response)
    raise Exception("Bad response view post")


uid = json.loads(view_post_response.text)

print(view_post_response)
print(view_url(uid))