import requests
import json

class ServiceDefinition:
    def __init__(self, url="", options=None):
        self.url = url
        self.options = options

    def run(self, curies):
        post_data = {
            'input': curies.to_json(),
            'options': self.options
        }
        
        pre_call_log = f'Calling Service - {self.url} - with data - \n{json.dumps(post_data, indent=2)}'
        # print(pre_call_log)
        response = requests.post(
            self.url,
            json=post_data)
        
        if response.status_code < 300:
            curies = response.json()
            # print('Service Complete')
            return (curies, False, '')

        # Uh oh
        post_call_log = f'Service not-completed {response.status_code}'
        # print(post_call_log)
        return ([], True, post_call_log)
