#!/usr/bin/env python

import requests
import json

alkaptonuria = {'curie': 'MONDO:0008753', 'label': 'Alkaptonuria'}
ebola = {'curie': 'MONDO:0005737', 'label': 'Ebola hemorrhagic fever'}
usher1 = {'curie': 'MONDO:0010168', 'label': 'Usher syndrome type 1'}
usher2 = {'curie': 'MONDO:0016484', 'label': 'Usher syndrome type 2'}

robokop_host = '127.0.0.1'
flowbokop_host = f'http://{robokop_host}/api/flowbokop'


# print('Flowbokop Expand Service')
# response = requests.post(
#     f'{flowbokop_host}/expand/disease/gene/',
#     json={'input': alkaptonuria})
# genes = response.json()
# print('Alkaptonuria -> Genes')
# print(genes)

# combined = {
#     'alkaptonuria': alkaptonuria,
#     'ebola': ebola
# }
# response = requests.post(
#     f'{flowbokop_host}/union/',
#     json={'input': combined})
# union = response.json()
# print('Flowbokop Union')
# print(union)


# combinedWithDups = {
#     'alkaptonuria': [alkaptonuria, ebola],
#     'ebola': ebola
# }
# response = requests.post(
#     f'{flowbokop_host}/intersection/',
#     json={'input': combinedWithDups})
# print(response)
# inter = response.json()
# print('Flowbokop Intersection')
# print(inter)

# response = requests.post(
#     f'{flowbokop_host}/intersection/',
#     json={'input': combined})
# empty = response.json()
# print('Flowbokop Intersection - Empty')
# print(empty)

# workflow_input = {
#     'input': {
#         'alkaptonuria': alkaptonuria,
#         'ebola': ebola
#     },
#     'options': {
#         'output': 'all',
#         'operations': [
#             {
#                 'input': 'alkaptonuria',
#                 'output': 'alkaptonuria_genes',
#                 'service': f'{flowbokop_host}/expand/disease/gene/'
#             },
#             {
#                 'input': 'ebola',
#                 'output': 'ebola_genes',
#                 'service': f'{flowbokop_host}/expand/disease/gene/'
#             },
#             {
#                 'input': ['alkaptonuria_genes', 'ebola_genes'],
#                 'output': 'combined_genes',
#                 'service': f'{flowbokop_host}/union/'
#             },
#         ]
#     }
# }

# response = requests.post(
#     f'{flowbokop_host}/',
#     json=workflow_input)
# print(response)
# output = response.json()
# print('Flowbokop')
# print(json.dumps(output, indent=2))



workflow_input = {
    'input': {
        'usher1': usher1,
        'usher2': usher2
    },
    'options': {
        'output': 'all',
        'operations': [
            {
                'input': 'usher1',
                'output': 'usher1_genes',
                'service': f'{flowbokop_host}/expand/disease/gene/'
            },
            {
                'input': 'usher2',
                'output': 'usher2_genes',
                'service': f'{flowbokop_host}/expand/disease/gene/'
            },
            {
                'input': ['usher1_genes', 'usher2_genes'],
                'output': 'common_genes',
                'service': f'{flowbokop_host}/intersection/'
            },
        ]
    }
}


response = requests.post(
    f'{flowbokop_host}/graph/',
    json=workflow_input)

output = response.json()
print('Workflow Computation Graph')
print(json.dumps(output, indent=2))


response = requests.post(
    f'{flowbokop_host}/',
    json=workflow_input)

output = response.json()
print('Workflow Output')
print(json.dumps(output, indent=2))


