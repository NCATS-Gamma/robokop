#!/bin/bash

cd $ROBOKOP_HOME/robokop

celery -A manager.tasks.celery worker --loglevel=debug -c $NUM_RANKERS -n manager_answerer@robokop -Q manager_answer
