#!/bin/sh
if [ -z ${RESULTS_PASSWORD} ] || [ -z ${RESULTS_PORT} ]; then
    echo "
    Results redis server password or results redis server are not set on your environment.
    Please make sure those are set accordingly.
    "

export REDIS_CONTAINER=$(docker container ls -f name=robokop_results -q)
echo "Dumping....."
docker exec $REDIS_CONTAINER bash -c "redis-cli -u redis://:$RESULTS_PASSWORD@127.0.0.1:$RESULTS_PORT save"
FILE_NAME="dump$(date +%Y-%m-%d#%H-%M-%S).rdb"
echo "Coping file to $FILE_NAME......"
docker cp $REDIS_CONTAINER:/data/dump.rdb ./redis-dump/$FILE_NAME
echo "Done"