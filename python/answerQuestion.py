#!/usr/bin/env python  
import json
import argparse
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine

# TODO: remove this after testing
engine = create_engine('postgresql://patrick@localhost:5432/robokop')
engine.execute('drop table if exists {}'.format('answer'))
engine.execute('drop table if exists {}'.format('answer_set'))
engine.execute('drop table if exists {}'.format('question'))

from Question import Question
from Answer import Answer, AnswerSet

from base import Base
Base.metadata.create_all(engine)

if __name__ == '__main__':
    # parse arguments
    parser = argparse.ArgumentParser(description='Test protocop result ranking.')
    parser.add_argument('question_json_filename')
    args = parser.parse_args()

    # get struct from json file
    with open(args.question_json_filename) as f:
        struct = json.load(f)

    # construct Question
    question = Question(struct)

    # get AnswerSet
    answerSet = question.answer()

    print(repr(question))
    print(repr(answerSet))
    for answer in answerSet:
        print(repr(answer))