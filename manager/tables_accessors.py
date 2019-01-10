import os
import json
# import requests
from uuid import uuid4
from manager.setup_db import session_scope
from manager.tables import Answerset, Question

# def get_questions_list():
#     """Get list of questions."""
#     post_data = {"query": f'''
# {{
#   questions: allQuestionsList {{
#     id
#     natural_question: naturalQuestion
#     machine_question: qgraphByQgraphId {{
#       edges: qedgesByQgraphIdList {{
#         id
#         source_id: sourceId
#         target_id: targetId
#         type
#       }}
#       nodes: qnodesByQgraphIdList {{
#         id
#         type
#       }}
#     }}
#   }}
# }}
#     '''}
#     response = requests.post(
#         f'http://{os.environ["GRAPHQL_HOST"]}:{os.environ["GRAPHQL_PORT"]}/graphql',
#         json=post_data)
#     return response.json()


# def get_question_json_by_id(question_id):
#     """Get question by id."""
#     post_data = {"query": f'''
# {{
#   question: questionById(id: "{question_id}") {{
#     id
#     natural_question: naturalQuestion
#     machine_question: qgraphByQgraphId {{
#       body
#     }}
#   }}
# }}
#     '''}
#     response = requests.post(
#         f'http://{os.environ["GRAPHQL_HOST"]}:{os.environ["GRAPHQL_PORT"]}/graphql',
#         json=post_data)
#     question = response.json()['data']['question']
#     machine_question = question['machine_question'].pop('body')
#     question['machine_question'].update(json.loads(machine_question))
#     return question


def get_question_by_id(qid):
    '''Note this only returns JSON because the Question SQLAlchemy object dies with the session, and we need to close the session'''
    with session_scope() as session:
        question = session.query(Question).filter(Question.id == qid).first().dump()
    if not question:
        raise KeyError("No such question.")
    return question

def delete_question_by_id(qid):
    with session_scope() as session:
        question = session.query(Question).filter(Question.id == qid).first()
        if not question:
            raise KeyError("No such question.")
        session.delete(question)

def modify_question_by_id(qid, mods):
    with session_scope() as session:
        question = session.query(Question).filter(Question.id == qid).first()
        if not question:
            raise KeyError("No such question.")
        for key in mods:
            setattr(question, key, mods[key])

def get_qgraph_id_by_question_id(qid):
    with session_scope() as session:
        qgraph_id = session.query(Question).filter(Question.id == qid).first().qgraph_id
    if not qgraph_id:
        raise KeyError("No such question.")
    return qgraph_id


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