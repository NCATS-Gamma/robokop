#!/bin/bash

export NEO4J_NAME=robokop-neo4j
export NEO4J_HTTP_PORT=7474
export NEO4J_BOLT_PORT=7687

export REDIS_NAME=robokop-redis
export REDIS_PORT=6379

export CELERY_BROKER_URL="redis://$REDIS_HOST:$REDIS_PORT/0"
export CELERY_RESULT_BACKEND="redis://$REDIS_HOST:$REDIS_PORT/0"

export POSTGRES_NAME=robokop-postgres
export POSTGRES_PORT=5432
export POSTGRES_USER=murphy
export POSTGRES_DB=robokop

export ROBOKOP_NAME=robokop-web

# network
docker network create \
    --subnet=172.18.0.0/16 \
    robokop-docker-net

# Neo4J setup
mkdir ./neo4j/
mkdir ./neo4j/plugins
mkdir ./neo4j/logs
curl https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/3.2.3.6/apoc-3.2.3.6-all.jar -o neo4j/plugins/apoc-3.2.3.6-all.jar
curl https://github.com/NCATS-Gamma/robokop-neo4j-plugin/releases/download/v1.0.0/robokop-1.0.0.jar -o neo4j/plugins/robokop-1.0.0.jar

# Neo4j:
# https://hub.docker.com/_/neo4j/
# https://neo4j.com/docs/operations-manual/current/installation/docker/
# https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/
docker run \
    --name robokop-neo4j \
    --net robokop-docker-net \
    --env NEO4J_dbms_security_auth__enabled=false \
    --env NEO4J_dbms_connectors_default__listen__address=0.0.0.0 \
    -e NEO4J_dbms_security_procedures_unrestricted=apoc.\\\* \ # un-sandbox apoc procedures: http://blog.armbruster-it.de/2017/05/running-neo4j-3-2-apoc-docker/
    --publish $NEO4J_HTTP_PORT:$NEO4J_HTTP_PORT \
    --publish $NEO4J_BOLT_PORT:$NEO4J_BOLT_PORT \
    -v $(pwd)/neo4j/logs:/logs \
    -d \
    patrickkwang/robokop-neo4j

# Redis:
# https://hub.docker.com/_/redis/
docker run \
    --name robokop-redis \
    --net robokop-docker-net \
    -d \
    redis

# Postgres:
# https://hub.docker.com/_/postgres/
docker run \
    --name robokop-postgres \
    --net robokop-docker-net \
    --env POSTGRES_USER \
    --env POSTGRES_DB \
    -d \
    postgres
# docker run -it --rm --net robokop-docker-net postgres psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB

# Web server
docker run \
    --name robokop-web \
    --net robokop-docker-net \
    --env NEO4J_HOST=$NEO4J_NAME \
    --env NEO4J_HTTP_PORT \
    --env NEO4J_BOLT_PORT \
    --env REDIS_HOST=$REDIS_NAME \
    --env REDIS_PORT \
    --env CELERY_BROKER_URL \
    --env CELERY_RESULT_BACKEND \
    --env POSTGRES_HOST=$POSTGRES_NAME \
    --env POSTGRES_PORT \
    --env POSTGRES_USER \
    --env POSTGRES_DB \
    --publish 80:80 \
    -v $(pwd)/shared:/home/murphy/shared \
    -it \
    patrickkwang/robokop-web bash

# to detach:   CTRL-q, CTRL-p
# to reattach: docker attach robokop-web

# docker stop robokop-web robokop-neo4j robokop-redis robokop-postgres
# docker rm robokop-web robokop-neo4j robokop-redis robokop-postgres