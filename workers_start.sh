#!/bin/bash

# This should only be run from the main robokop.git directory

cd $ROBOKOP_HOME/robokop/python
celery multi start answerer@robokop updater@robokop initializer@robokop -A tasks.celery -l info -c:1 4 -c:2 1 -c:3 4 -Q:1 answer -Q:2 update -Q:3 initialize
celery flower -A tasks.celery
# waits here for SIGINT
celery multi stop answerer@robokop updater@robokop

# `celery multi start...`` is equivalent to:
#   celery -A tasks.celery worker --loglevel=info -c 4 -n answerer@robokop -Q answer
#   celery -A tasks.celery worker --loglevel=info -c 1 -n updater@robokop -Q update