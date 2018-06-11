import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from manager.question import Question as QuestionModel
from manager.answer import Answerset as AnswersetModel, Answer as AnswerModel

class Question(SQLAlchemyObjectType):
    class Meta:
        model = QuestionModel

class Answerset(SQLAlchemyObjectType):
    class Meta:
        model = AnswersetModel

class Answer(SQLAlchemyObjectType):
    class Meta:
        model = AnswerModel

class Query(graphene.ObjectType):
    questions = graphene.List(Question)

    def resolve_questions(self, info):
        query = Question.get_query(info)  # SQLAlchemy query
        return query.all()

    answers = graphene.List(Answer)

    def resolve_answers(self, info):
        query = Answer.get_query(info)  # SQLAlchemy query
        return query.all()

schema = graphene.Schema(query=Query)