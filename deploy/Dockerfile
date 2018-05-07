# This Dockerfile is used to build ROBOKOP

FROM python:3

LABEL maintainer="patrick@covar.com"
ENV REFRESHED_AT 2018-05-04

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

RUN apt-get update
RUN apt-get upgrade -y

## Install basic tools
RUN apt-get install -yq \
    vim

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
RUN git clone https://github.com/NCATS-Gamma/robokop.git

WORKDIR /home/murphy/robokop
RUN git checkout divorce

## Install all requirements
RUN pip install -r ./requirements.txt

## Set up the website
RUN npm install
RUN npm run webpackProd
RUN pip install git+https://github.com/Supervisor/supervisor@master

WORKDIR /home/murphy
RUN rm -r /home/murphy/robokop

## Finish up
ENV HOME=/home/murphy
ENV USER=murphy
COPY ./startup.sh /home/murphy/startup.sh
COPY ./supervisord.conf /home/murphy/supervisord.conf

ENTRYPOINT ["./startup.sh"]
CMD ["supervisord", "-c", "./supervisord.conf"]