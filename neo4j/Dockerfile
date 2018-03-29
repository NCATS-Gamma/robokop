FROM neo4j:3.2.6
MAINTAINER Patrick Wang <patrick@covar.com>

ENV APOC_URI https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/3.2.3.6/apoc-3.2.3.6-all.jar
ENV ROBOKOP_URI https://github.com/NCATS-Gamma/robokop-neo4j-plugin/releases/download/v1.0.0/robokop-1.0.0.jar

RUN mkdir /plugins

RUN wget $APOC_URI \
    && mv apoc-3.2.3.6-all.jar /plugins

RUN wget $ROBOKOP_URI \
    && mv robokop-1.0.0.jar /plugins

EXPOSE 7474 7473 7687

CMD ["neo4j"]