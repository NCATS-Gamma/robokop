# This Dockerfile is used to build ROBOKOP
#
# based on Ubuntu

FROM python:3

LABEL maintainer="patrick@covar.com"
ENV REFRESHED_AT 2018-03-23

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

## Install more things
RUN apt-get install -yq \
    libkrb5-dev
RUN pip install gnureadline

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

## ugh dependency issues
RUN sed -i -e 's/gnureadline==6.3.3/gnureadline==6.3.8/' ../robokop-build/builder/requirements.txt
RUN sed -i -e 's/gnureadline==6.3.3/gnureadline==6.3.8/' ../robokop-interfaces/greent/requirements.txt

## Install all requirements
RUN pip install -r ../robokop-interfaces/greent/requirements.txt
RUN pip install -r ../robokop-build/builder/requirements.txt
RUN pip install -r ./requirements.txt

## Set up the website
RUN sed -i -e 's/"\(enable.*\)": false/"\1": true/' ./config.json
RUN npm install
RUN npm run webpack

## Finish up
ENV HOME=/home/murphy
COPY ./startup.sh /home/murphy/startup.sh
CMD ["../startup.sh"]