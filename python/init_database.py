#!/usr/bin/env python  
import os
import json
import argparse
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine

from setup import db

# The linter says these are unused. We have to define them anyway in order to create the associated tables.
from user import User, Role
from question import Question
from answer import Answer, AnswerSet
from feedback import Feedback

from answer_question import answer_question

def init_database():
    # drop all the tables
    db.engine.execute('drop table if exists {}'.format('feedback'))
    db.engine.execute('drop table if exists {}'.format('answer'))
    db.engine.execute('drop table if exists {}'.format('answer_set'))
    db.engine.execute('drop table if exists {}'.format('question'))

    # re-create them
    db.create_all()

    # populate them from question JSON file
    q_filename = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'json', 'question_alkaptonuria.json')
    answer_question(q_filename)

    # create example feedback

if __name__ == '__main__':
    init_database()