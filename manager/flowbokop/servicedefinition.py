import logging
import requests
import json

import manager.logging_config

logger = logging.getLogger(__name__)

class ServiceDefinition:
    def __init__(self, url="", options=None):
        self.url = url
        self.options = options

    def run(self, curies):
        post_data = {
            'input': curies.to_json(),
            'options': self.options
        }
        
        pre_call_log = f'Calling Service - {self.url}'
        logger.debug(pre_call_log)
        try:
            response = requests.post(
                self.url,
                json=post_data)
        except:
            # More than likely a timeout or bad url
            post_call_log = f'Service not-completed - Connection failure'
            logger.debug(post_call_log)
            return ([], True, post_call_log)

        

        if response.status_code < 300:
            curies = response.json()
            post_call_log = 'Service successfully completed'
            logger.debug(post_call_log)
            return (curies, False, '')

        # Uh oh
        post_call_log = f'Service not-completed {response.status_code}\nError Message:\n{response.text}'
        logger.debug(post_call_log)
        return ([], True, post_call_log)
