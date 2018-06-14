#!/bin/bash

cd $ROBOKOP_HOME/robokop

exec flower \
    -A manager.tasks.celery \
    --broker=$CELERY_BROKER_URL \
    --broker_api=$FLOWER_BROKER_API