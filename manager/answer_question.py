#!/usr/bin/env python  
import json
import argparse
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine

from manager.user import User, Role
from manager.question import Question
from manager.answer import Answer, Answerset
from manager.feedback import Feedback

from manager.setup import db

def answer_question(question_json_filename):
    # get struct from json file
    with open(question_json_filename) as f:
        struct = json.load(f)

    # construct Question
    question = Question(struct)

    # get AnswerSet
    answer_set = question.answer()
    return answer_set

if __name__ == '__main__':
    # parse arguments
    parser = argparse.ArgumentParser(description='Test protocop result ranking.')
    parser.add_argument('question_json_filename')
    args = parser.parse_args()

    # get AnswerSet
    answer_set = answer_question(args.question_json_filename)

    print(question.to_json())
    print(answer_set.to_json())
    for answer in answer_set:
        print(answer.to_json())