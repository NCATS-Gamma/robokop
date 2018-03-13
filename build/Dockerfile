# This Dockerfile is used to build an headles vnc image based on Ubuntu

FROM ubuntu:16.04

LABEL maintainer="patrick@covar.com"
ENV REFRESHED_AT 2018-02-12

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8

RUN apt-get update --fix-missing && apt-get install -y wget bzip2 ca-certificates \
    libglib2.0-0 libxext6 libsm6 libxrender1 \
    git mercurial subversion

RUN echo 'export PATH=/opt/conda/bin:$PATH' > /etc/profile.d/conda.sh && \
    wget --quiet https://repo.continuum.io/archive/Anaconda3-5.0.1-Linux-x86_64.sh -O ~/anaconda.sh && \
    /bin/bash ~/anaconda.sh -b -p /opt/conda && \
    rm ~/anaconda.sh

RUN apt-get install -y curl grep sed dpkg && \
    TINI_VERSION=`curl https://github.com/krallin/tini/releases/latest | grep -o "/v.*\"" | sed 's:^..\(.*\).$:\1:'` && \
    curl -L "https://github.com/krallin/tini/releases/download/v${TINI_VERSION}/tini_${TINI_VERSION}.deb" > tini.deb && \
    dpkg -i tini.deb && \
    rm tini.deb && \
    apt-get clean

ENV PATH /opt/conda/bin:$PATH

## Setup
ENV INST_SCRIPTS=$HOME/install
ADD ./src/neo4j/install/ $INST_SCRIPTS/
RUN find $INST_SCRIPTS -name '*.sh' -exec chmod a+x {} +

## Install neo4j
RUN $INST_SCRIPTS/neo4j.sh
RUN $INST_SCRIPTS/neo4j_conf.sh

## Add apoc
RUN $INST_SCRIPTS/apoc.sh

## Install tools
RUN apt-get install -yq\
    vim

## Install NodeJS
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install nodejs

## Install tools
RUN apt-get install -yq \
    libkrb5-dev \
    gcc
RUN pip install gnureadline

## Setup home directory
RUN mkdir /home/murphy
WORKDIR /home/murphy

## Get software
RUN git clone https://github.com/NCATS-Gamma/robokop.git
RUN git clone https://github.com/NCATS-Gamma/robokop-rank.git
RUN git clone https://github.com/NCATS-Gamma/robokop-build.git
RUN git clone https://github.com/NCATS-Gamma/robokop-interfaces.git

WORKDIR /home/murphy/robokop

## ugh dependency issues
RUN sed -i -e 's/gnureadline==6.3.3/gnureadline==6.3.8/' ../robokop-build/builder/requirements.txt
RUN sed -i -e 's/gnureadline==6.3.3/gnureadline==6.3.8/' ../robokop-interfaces/greent/requirements.txt

## install all requirements
RUN pip install -r ../robokop-build/builder/requirements.txt
RUN pip install -r ../robokop-interfaces/greent/requirements.txt
RUN pip install -r ./requirements.txt

## set up the website
RUN npm install
RUN npm run webpack

## copy Neo4j database and associated blackboards sqlite database
COPY ./graph.db /var/lib/neo4j/data/databases/graph.db
RUN chown -R neo4j:neo4j /var/lib/neo4j/data/databases/graph.db
COPY ./blackboards.db /home/murphy/robokop/blackboards.db

## copy files necessary for query generation
COPY ./ICD_Combo_Chi2.txt     /home/murphy/robokop-build/builder/ICD_Combo_Chi2.txt
COPY ./AllDxCounts.txt        /home/murphy/robokop-build/builder/AllDxCounts.txt
COPY ./CTD_chem_gene_ixns.tsv /home/murphy/robokop-interfaces/greent/CTD_chem_gene_ixns.tsv
COPY ./CTD_chemicals.tsv      /home/murphy/robokop-interfaces/greent/CTD_chemicals.tsv
COPY ./chemotext.words.txt    /home/murphy/robokop-interfaces/greent/chemotext.words.txt

EXPOSE 5000
EXPOSE 7474
EXPOSE 7687

## Finish up
ENV HOME=/home/murphy
WORKDIR /home/murphy/robokop
COPY ./startup.sh /home/murphy/startup.sh
ENTRYPOINT ["../startup.sh"]