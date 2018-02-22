#!/usr/bin/env python  
import json
import argparse
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine

from robokop_flask_config  import SQLALCHEMY_DATABASE_URI
engine = create_engine(SQLALCHEMY_DATABASE_URI)

# TODO: remove this after testing
# engine.execute('drop table if exists {}'.format('answer'))
# engine.execute('drop table if exists {}'.format('answer_set'))
# engine.execute('drop table if exists {}'.format('question'))

from question import Question
from answer import Answer, AnswerSet

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

    print(question.toJSON())
    print(answerSet.toJSON())
    for answer in answerSet:
        print(answer.toJSON())