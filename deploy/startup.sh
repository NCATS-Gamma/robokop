#!/bin/bash

screen -dmS robokop && {
  sleep 2;
  screen -S robokop -X -p backend screen sh -c 'cd backend; docker-compose up';
  sleep 20;
  screen -S robokop -X -p graph screen sh -c 'cd graph; docker-compose up';
  screen -S robokop -X -p cache screen sh -c 'cd cache; docker-compose up';
  sleep 20;
  screen -S robokop -X -p manager screen sh -c 'cd manager; docker-compose up';
  screen -S robokop -X -p rank screen sh -c 'cd ../../robokop-rank/deploy; docker-compose up';
  screen -S robokop -X -p interfaces screen sh -c 'cd ../../robokop-interfaces/deploy; docker-compose up';
}
sleep 10;
screen -rd robokop