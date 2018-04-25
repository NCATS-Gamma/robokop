#!/bin/bash

cd $ROBOKOP_HOME/robokop-interfaces/greent
PYTHONPATH=.. python rosetta.py --delete-type-graph --initialize-type-graph