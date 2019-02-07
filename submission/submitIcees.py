#!/usr/bin/env python

import os
from managerJobSubmitter import ManagerJobSubmitter 

job_submitter = ManagerJobSubmitter()
job_submitter.manager_url = 'http://robokop.renci.org'
job_submitter.username = ''
job_submitter.password = ''

init_dir = os.path.dirname(os.path.realpath(__file__))

try:
    os.makedirs(f'{init_dir}/jobs/icees_drugs')
except:
    pass

job_submitter.submit_from_template(f'{init_dir}/job_lists/icess_drugs.csv', f'{init_dir}/templates/wf5_drugs.json', f'{init_dir}/jobs/icees_drugs')

try:
    os.makedirs(f'{init_dir}/jobs/icees_chemicals')
except:
    pass


job_submitter.submit_from_template(f'{init_dir}/job_lists/icess_chemicals.csv', f'{init_dir}/templates/wf5_chemical.json', f'{init_dir}/jobs/icees_chemicals')
