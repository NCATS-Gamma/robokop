import os
import json
import requests
from uuid import uuid4
from manager.setup_db import session_scope, db_session
from manager.tables import Answerset, Question


def get_questions_list():
    """Get list of questions."""
    post_data = {"query": f'''
{{
  questions: allQuestionsList {{
    id
    natural_question: naturalQuestion
    machine_question: qgraphByQgraphId {{
      edges: qedgesByQgraphIdList {{
        id
        source_id: sourceId
        target_id: targetId
        type
      }}
      nodes: qnodesByQgraphIdList {{
        id
        type
      }}
    }}
  }}
}}
    '''}
    response = requests.post(
        f'http://{os.environ["GRAPHQL_HOST"]}:{os.environ["GRAPHQL_PORT"]}/graphql',
        json=post_data)
    return response.json()


def get_question_json_by_id(question_id):
    """Get question by id."""
    post_data = {"query": f'''
{{
  question: questionById(id: "{question_id}") {{
    id
    natural_question: naturalQuestion
    machine_question: qgraphByQgraphId {{
      body
    }}
  }}
}}
    '''}
    response = requests.post(
        f'http://{os.environ["GRAPHQL_HOST"]}:{os.environ["GRAPHQL_PORT"]}/graphql',
        json=post_data)
    question = response.json()['data']['question']
    machine_question = question['machine_question'].pop('body')
    question['machine_question'].update(json.loads(machine_question))
    return question


def get_question_by_id(qid, session=None):
    if session is None:
        session = db_session
    question = session.query(Question).filter(Question.id == qid).first()
    if not question:
        raise KeyError("No such question.")
    return question


def add_question(q_json, qid=None, **kwargs):
    """Add question."""
    if qid is None:
        qid = str(uuid4())

    with session_scope() as session:
        question = Question(q_json, id=qid, **kwargs)
        session.add(question)
    return qid


def add_answerset(m_json, mid=None, **kwargs):
    """Add answerset."""
    if mid is None:
        mid = str(uuid4())

    with session_scope() as session:
        aset = Answerset(m_json, id=mid, **kwargs)
        session.add(aset)
    return mid
