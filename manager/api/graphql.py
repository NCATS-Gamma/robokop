from flask_graphql import GraphQLView
from manager.api.schema import schema
from manager.setup import app

# Do this so that SwaggerUI does not find the GraphQL endpoint and get jealous
class myGraphQLView(GraphQLView):
    def get(self):
        pass
    def post(self):
        pass
    def delete(self):
        pass
    def put(self):
        pass

app.add_url_rule(
    '/graphql',
    view_func=myGraphQLView.as_view(
        'graphql',
        schema=schema,
        graphiql=True # for having the GraphiQL interface
    )
)
