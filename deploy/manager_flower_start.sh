#!/bin/bash

cd $ROBOKOP_HOME/robokop/python

exec flower \
    -A tasks.celery \
    --broker=$CELERY_BROKER_URL \
    --broker_api=$CELERY_BROKER_URL