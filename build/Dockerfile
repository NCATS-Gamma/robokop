# This Dockerfile is used to build ROBOKOP
#
# based on Ubuntu

FROM ubuntu:16.04

LABEL maintainer="patrick@covar.com"
ENV REFRESHED_AT 2018-03-13

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8

## Upgrade (get out of pre-release)
RUN apt-get update
RUN apt-get upgrade -y

## Install basic tools
RUN apt-get install -yq \
    vim \
    gcc

## Set up anaconda
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

## Install NodeJS
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

## Install more things
RUN apt-get install -yq \
    libkrb5-dev
RUN pip install gnureadline

## Set up home directory
RUN mkdir /home/murphy
WORKDIR /home/murphy

## Get software
RUN git clone https://github.com/NCATS-Gamma/robokop-interfaces.git
RUN git clone https://github.com/NCATS-Gamma/robokop-build.git
RUN git clone https://github.com/NCATS-Gamma/robokop-rank.git
RUN git clone https://github.com/NCATS-Gamma/robokop.git

WORKDIR /home/murphy/robokop

RUN git checkout docker

## ugh dependency issues
RUN sed -i -e 's/gnureadline==6.3.3/gnureadline==6.3.8/' ../robokop-build/builder/requirements.txt
RUN sed -i -e 's/gnureadline==6.3.3/gnureadline==6.3.8/' ../robokop-interfaces/greent/requirements.txt

## Install all requirements
RUN pip install -r ../robokop-interfaces/greent/requirements.txt
RUN pip install -r ../robokop-build/builder/requirements.txt
RUN pip install -r ./requirements.txt

## Set up the website
RUN npm install
RUN npm run webpack

## Copy Neo4j database and associated blackboards sqlite database
# COPY ./graph.db /var/lib/neo4j/data/databases/graph.db
# RUN chown -R neo4j:neo4j /var/lib/neo4j/data/databases/graph.db

## Copy files necessary for query generation
# COPY ./ICD_Combo_Chi2.txt     /home/murphy/robokop-build/builder/ICD_Combo_Chi2.txt
# COPY ./AllDxCounts.txt        /home/murphy/robokop-build/builder/AllDxCounts.txt
# COPY ./CTD_chem_gene_ixns.tsv /home/murphy/robokop-interfaces/greent/CTD_chem_gene_ixns.tsv
# COPY ./CTD_chemicals.tsv      /home/murphy/robokop-interfaces/greent/CTD_chemicals.tsv
# COPY ./chemotext.words.txt    /home/murphy/robokop-interfaces/greent/chemotext.words.txt

# EXPOSE 80

## Finish up
ENV HOME=/home/murphy
WORKDIR /home/murphy/robokop
COPY ./startup.sh /home/murphy/startup.sh
RUN sed -i -e 's/import robokop_setup_environ//' ./python/robokop_flask_config.py
RUN sed -i -e 's/"\(enable.*\)": false/"\1": true/' ./config.json
ENTRYPOINT ["../startup.sh"]