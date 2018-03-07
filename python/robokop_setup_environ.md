# robokop_set_environ.py

## Overview
You will need to create a python file to hold the local settings for the flask webserver of ROBOKOP. This python script is called from server.py. Several environmental variables are declared and then later referenced within the python server process. 

## Example Code
An example file would look like the following:

```python
import os

os.environ["ROBOKOP_SECRET_KEY"] = ''
os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"] = ''
os.environ["ROBOKOP_SECURITY_EMAIL_SENDER"] = ''

os.environ["ROBOKOP_POSTGRESQL_USER"] = ''
os.environ["ROBOKOP_POSTGRESQL_HOST"] = ''
os.environ["ROBOKOP_POSTGRESQL_PORT"] = ''
os.environ["ROBOKOP_SECURITY_PASSWORD_SALT"] = ''

os.environ["ROBOKOP_MAIL_SERVER"] = ''
os.environ["ROBOKOP_MAIL_USERNAME"] = ''
os.environ["ROBOKOP_MAIL_PASSWORD"] = ''
```