# Small modification to the neo4j:3.2.6 image
# * add apoc plugin

FROM neo4j:3.2.6

LABEL maintainer="patrick@covar.com"
ENV REFRESHED_AT 2018-03-16

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8

## Add apoc
RUN wget --quiet https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/3.2.3.5/apoc-3.2.3.5-all.jar \
    -O /var/lib/neo4j/plugins/apoc.jar