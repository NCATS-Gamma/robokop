# PROTOCOP - Answer Ranking

The PROTOCOP answer-finding and -ranking algorithms operate from a query specification and completed blackboard stored in the local Neo4j instance. The path-finding algorithm generates a specialized Cypher query from the input user query and extracts answer graphs. These answer graphs are then ranked using a customized version of the NAGA algorithm.

The command line interface to the ranking procedure can be used with a running local version of the software. Instructions for setting that up are [here](./doc/webserver/webserver_doc.md).

To initiate a ranking process using the command line interface, navigate to the root directory of the protocop-rank repository and run `python python/rankQueryResults.py`. Use of the `-h` provides information about the command line arguments that this function takes.
