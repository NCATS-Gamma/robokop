#!/bin/sh

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# source $BASEDIR/shared/setenv.sh
export $(cat $BASEDIR/shared/robokop.env | grep -v ^# | xargs)
source activate robokop