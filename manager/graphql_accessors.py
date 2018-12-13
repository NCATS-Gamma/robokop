import os
import requests
from uuid import uuid4
from manager.setup import api, db, session_scope
from manager.tables import Message, Question


def get_questions_list():
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


def get_question_by_id(question_id):
    post_data = {"query": f'''
{{
  question: questionById(id: "{question_id}") {{
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
        curie
      }}
    }}
  }}
}}
    '''}
    response = requests.post(
        f'http://{os.environ["GRAPHQL_HOST"]}:{os.environ["GRAPHQL_PORT"]}/graphql',
        json=post_data)
    return response.json()['data']['question']


def add_question(q_json, qid=None, **kwargs):
    if qid is None:
        qid = str(uuid4())

    with session_scope() as session:
        question = Question(q_json, id=qid, **kwargs)
        session.add(question)
        session.commit()
    return qid


def add_message(m_json, mid=None, **kwargs):
    if mid is None:
        mid = str(uuid4())

    with session_scope() as session:
        message = Message(m_json, id=mid, **kwargs)
        session.add(message)
        session.commit()
    return mid
