#!/usr/bin/env python

import os
from managerJobSubmitter import ManagerJobSubmitter 

job_submitter = ManagerJobSubmitter()
job_submitter.manager_url = 'http://127.0.0.1'

init_dir = os.path.dirname(os.path.realpath(__file__))

try:
    os.makedirs(f'{init_dir}/jobs/cop_disease')
except:
    pass

job_submitter.submit_from_template(f'{init_dir}/job_lists/cops.csv', f'{init_dir}/templates/cop_disease.json', f'{init_dir}/jobs/cop_disease')

try:
    os.makedirs(f'{init_dir}/jobs/cop_phenotype')
except:
    pass


job_submitter.submit_from_template(f'{init_dir}/job_lists/cops.csv', f'{init_dir}/templates/cop_phenotype.json', f'{init_dir}/jobs/cop_phenotype')