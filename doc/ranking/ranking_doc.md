# PROTOCOP - Answer Ranking

The PROTOCOP answer-finding and -ranking algorithms operate from a query specification and completed blackboard stored in the local Neo4j instance. The path-finding algorithm generates a specialized Cypher query from the input user query and extracts answer graphs. These answer graphs are then ranked using a customized version of the NAGA algorithm.

This document details how to initiate the ranking process in python 3.