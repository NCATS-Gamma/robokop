# This Dockerfile is used to build ROBOKOP

FROM python:3

LABEL maintainer="patrick@covar.com"
ENV REFRESHED_AT 2018-04-11

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

## Upgrade (get out of pre-release)
# RUN apt-get install -y apt-utils
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get update --fix-missing

## Install basic tools
RUN apt-get install -yq \
    vim \
    gcc \
    wget \
    git \
    curl

## Install NodeJS
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

## This thing is required for node? IDK
RUN apt-get install -yq \
    libkrb5-dev

## Set up home directory
RUN useradd -m -s /bin/bash murphy
WORKDIR /home/murphy

## Get ROBOKOP software
RUN git clone https://github.com/NCATS-Gamma/robokop-interfaces.git
RUN git clone https://github.com/NCATS-Gamma/robokop-build.git
RUN git clone https://github.com/NCATS-Gamma/robokop-rank.git
RUN git clone https://github.com/NCATS-Gamma/robokop.git

WORKDIR /home/murphy/robokop
RUN git checkout docker
RUN git reset --hard 82910d6cffa47346367370695e1728eb92daed21
WORKDIR /home/murphy/robokop-interfaces
RUN git checkout config
RUN git reset --hard 4711afa36bec593d7747a22eb48f4d9e19109509
WORKDIR /home/murphy/robokop-build
RUN git reset --hard d36a228cb3b52b060f653ed6f43a7e37beaecb58
WORKDIR /home/murphy/robokop

## Install all requirements
RUN pip install -r ../robokop-interfaces/greent/requirements.txt
RUN pip install -r ../robokop-build/builder/requirements.txt
RUN pip install -r ./requirements.txt

## Set up the website
RUN npm install
RUN npm run webpackProd

## Finish up
ENV HOME=/home/murphy
COPY ./startup.sh /home/murphy/startup.sh
CMD ["../startup.sh"]