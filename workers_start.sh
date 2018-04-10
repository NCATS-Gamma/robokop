#!/bin/bash

# This should only be run from the main robokop.git directory

cd $ROBOKOP_HOME/robokop/python
celery multi start answerer@robokop updater@robokop -A tasks.celery -l info -c:1 4 -c:2 1 -Q:1 answer -Q:2 update
celery flower -A tasks.celery

# equivalent to:
#   celery -A tasks.celery worker --loglevel=info -c 4 -n answerer@robokop -Q answer
#   celery -A tasks.celery worker --loglevel=info -c 1 -n updater@robokop -Q update