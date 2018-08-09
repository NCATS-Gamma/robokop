# This Dockerfile is used to build ROBOKOP

FROM python:3.6.6-stretch

LABEL maintainer="patrick@covar.com"
ENV REFRESHED_AT 2018-06-05

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

## Install basic tools
RUN apt-get update
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

## Install all requirements
RUN pip install -r ./requirements.txt --src /usr/local/src

## Set up the website
# RUN npm install
# RUN npm run webpackProd

WORKDIR /home/murphy
RUN rm -r /home/murphy/robokop

## Finish up
ENV HOME=/home/murphy
ENV USER=murphy

ENTRYPOINT ["./robokop/deploy/startup.sh"]
CMD ["supervisord", "-c", "./robokop/deploy/supervisord.conf"]