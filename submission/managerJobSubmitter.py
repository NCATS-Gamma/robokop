
import os
import csv
import json
import requests
from requests.auth import HTTPBasicAuth

class ManagerJobSubmitter:
    manager_url = 'http://robokop.renci.org'
    
    def submit_from_template(self, jobs_csv, template_file, working_dir):
        self.fill_template(jobs_csv, template_file, working_dir)

        job_jsons = [os.path.join(working_dir, f) for f in os.listdir(working_dir) if os.path.isfile(os.path.join(working_dir, f)) and '.json' in f]

        for job_json in job_jsons:
            self.new_question(job_json)

    def fill_template(self, jobs_csv, template_file, output_location):
        jobs = []
        with open(jobs_csv) as csv_fid:
            csv_reader = csv.reader(csv_fid, delimiter=',')
            header = next(csv_reader)
            
            jobs = [{header[i]: col for i, col in enumerate(row)} for row in csv_reader]

        with open(template_file, 'r') as template_fid:
            template = template_fid.read()
        
        template_file_no_path = os.path.splitext(os.path.basename(template_file))[0]

        for i, job in enumerate(jobs):
            job_template = template
            for key in job:
                if job[key]:
                    job_template = job_template.replace(f'${key}$', job[key])

            if '$' in job_template:
                print(f'Row {i+1}: Job {job}, had unfilled template strings. The partially filled template was not written to file.')
                continue

            job_filename_no_path = f'{template_file_no_path}_{i:04d}.json'
            job_filename = os.path.join(output_location, job_filename_no_path)
            with open(job_filename, 'w') as job_fid:
                job_fid.write(job_template)

    def new_question(self, job_json):
        with open(job_json) as job_fid:
            job = json.load(job_fid)
        
        # print(f'Making request {job}')
        r = requests.post(f'{self.manager_url}/api/questions/?RebuildCache=true', json=job, auth=HTTPBasicAuth(os.environ['ADMIN_EMAIL'], os.environ['ADMIN_PASSWORD']))
        return r
