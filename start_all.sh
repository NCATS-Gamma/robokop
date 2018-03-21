#!/bin/bash

export NEO4J_HOST=172.18.0.21
export NEO4J_HTTP_PORT=7474
export NEO4J_BOLT_PORT=7687

export REDIS_HOST=172.18.0.22
export REDIS_PORT=6379

export POSTGRES_HOST=172.18.0.23
export POSTGRES_PORT=5432
export POSTGRES_USER=murphy
# export POSTGRES_PASSWORD=mysecretpassword
export POSTGRES_DB=robokop

export ROBOKOP_HOST=172.18.0.24

# network
docker network create \
    --subnet=172.18.0.0/16 \
    robokop-docker-net

# Neo4j:
# https://hub.docker.com/_/neo4j/
# https://neo4j.com/docs/operations-manual/current/installation/docker/
# https://neo4j.com/docs/operations-manual/current/reference/configuration-settings/
docker run \
    --name robokop-neo4j \
    --net robokop-docker-net \
    --ip $NEO4J_HOST \
    --env NEO4J_dbms_security_auth__enabled=false \
    --env NEO4J_dbms_connectors_default__listen__address=0.0.0.0 \
    -d \
    neo4j

# Redis:
# https://hub.docker.com/_/redis/
docker run \
    --name robokop-redis \
    --net robokop-docker-net \
    --ip $REDIS_HOST \
    -d \
    redis

# Postgres:
# https://hub.docker.com/_/postgres/
docker run \
    --name robokop-postgres \
    --net robokop-docker-net \
    --ip $POSTGRES_HOST \
    --env POSTGRES_USER \
    --env POSTGRES_DB \
    -d \
    postgres
    # --env POSTGRES_PASSWORD \
# docker run -it --rm --net robokop-docker-net postgres psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB

# Web server
docker run \
    --name robokop-web \
    --net robokop-docker-net \
    --ip $ROBOKOP_HOST \
    --env NEO4J_HOST \
    --env REDIS_HOST \
    --env POSTGRES_HOST \
    --env NEO4J_HTTP_PORT \
    --env NEO4J_BOLT_PORT \
    --env REDIS_PORT \
    --env POSTGRES_PORT \
    --env POSTGRES_USER \
    --env POSTGRES_DB \
    --publish 80:80 \
    -v $(pwd)/shared:/home/murphy/shared \
    -it \
    robokop bash

# docker attach robokop-web

# docker stop robokop-web robokop-neo4j robokop-redis robokop-postgres
# docker rm robokop-web robokop-neo4j robokop-redis robokop-postgres