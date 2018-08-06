#!/bin/bash

cd $ROBOKOP_HOME/robokop

exec flower \
    -A manager.tasks.celery \
    --broker_api=$FLOWER_BROKER_API