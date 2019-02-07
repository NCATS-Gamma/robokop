#!/bin/bash

cd $ROBOKOP_HOME/robokop

celery -A manager.tasks.celery worker --loglevel=debug -c $MANAGER_NUM_ANSWER_WORKERS -n manager_answerer@robokop -Q manager_answer
