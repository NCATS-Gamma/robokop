#!/bin/sh
if [ -z ${var+x} ];then
    echo "
    Please pass on the dump file you want to restore.

        Usage: restore-redis.sh <path-to-dump-file>
    "
    exit 1
fi

REDIS_CONTAINER=$(docker container ls -f name=robokop_results -q)
BACK_UP_FILE=$1 
docker cp $BACK_UP_FILE $REDIS_CONTAINER:/data/dump.rdb
docker restart $REDIS_CONTAINER