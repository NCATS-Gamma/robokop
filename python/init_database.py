#!/usr/bin/env python  
import os
import json
import argparse
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine

from setup import db

# The linter says these are unused. We have to define them anyway in order to create the associated tables.
from user import User, Role, get_user_by_id
from question import Question
from answer import Answer, Answerset
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
    q1_struct = json.loads('{"nodes":[{"id":0,"nodeSpecType":"Named Node","type":"NAME.DISEASE","label":"Alkaptonuria","isBoundName":true,"isBoundType":true,"meta":{"name":"Alkaptonuria"},"color":{"background":"#ff9896"}},{"id":1,"nodeSpecType":"Node Type","type":"Disease","label":"Disease","isBoundName":false,"isBoundType":true,"meta":{},"color":{"background":"#ff9896"}},{"id":2,"nodeSpecType":"Node Type","type":"Gene","label":"Gene","isBoundName":false,"isBoundType":true,"meta":{},"color":{"background":"#98df8a"}},{"id":3,"nodeSpecType":"Node Type","type":"GeneticCondition","label":"GeneticCondition","isBoundName":false,"isBoundType":true,"meta":{},"color":{"background":"#ff9896"}}],"edges":[{"start":0,"end":1,"length":[1]},{"start":1,"end":2,"length":[1]},{"start":2,"end":3,"length":[1]}],"id":"Query1_Alkaptonuria_cdw_chemotext2_chemotext","natural_question":"What genetic condition provides protection against Alkaptonuria?","name":"Question 1: Alkaptonuria","user_id":1,"notes":"This is where notes go."}')
    q2_struct = json.loads('{"nodes":[{"id":0,"nodeSpecType":"Named Node","type":"NAME.DISEASE","label":"Ebola Virus Disease","isBoundName":true,"isBoundType":true,"meta":{"name":"Alkaptonuria"},"color":{"background":"#ff9896"}},{"id":1,"nodeSpecType":"Node Type","type":"Disease","label":"Disease","isBoundName":false,"isBoundType":true,"meta":{},"color":{"background":"#ff9896"}},{"id":2,"nodeSpecType":"Node Type","type":"Gene","label":"Gene","isBoundName":false,"isBoundType":true,"meta":{},"color":{"background":"#98df8a"}},{"id":3,"nodeSpecType":"Node Type","type":"GeneticCondition","label":"GeneticCondition","isBoundName":false,"isBoundType":true,"meta":{},"color":{"background":"#ff9896"}}],"edges":[{"start":0,"end":1,"length":[1]},{"start":1,"end":2,"length":[1]},{"start":2,"end":3,"length":[1]}],"id":"Query1_Ebola_Virus_Disease_cdw_chemotext2_chemotext","natural_question":"What genetic condition provides protection against Ebola?","name":"Question 1: Ebola","user_id":1,"notes":"This is where notes go."}')
    questions = [Question(q1_struct), Question(q2_struct)]

    for q in questions:
        answerset = q.answer()
        answerset = q.answer()
        user = q.user

    answers = answerset.answers
    feedback1 = Feedback(answer=answers[0], user=user, notes="I hate it so much.", interestingness='one', correctness='incorrect')
    feedback2 = Feedback(answer=answers[0], user=user, notes="Well maybe it's not so bad.", interestingness='seven', correctness='doubtful')

    # # get all the things, from the top
    # user = get_user_by_id(1)
    # questions = user.questions
    # answersets = questions[0].answersets()
    # answers = answersets[0].answers
    # feedback = answers[0].feedback

if __name__ == '__main__':
    init_database()