from manager.setup import swagger

@swagger.definition('Response')
class Response():
    """
    Response
    ---
    type: "object"
    properties:
        type:
            type: "string"
            example: "medical_translator_query_response"
            description: "Entity type of this response"
        id:
            type: "string"
            example: "http://rtx.ncats.io/api/rtx/v1/response/1234"
            description: "URI for this response"
        tool_version:
            type: "string"
            example: "RTX 0.5.1"
            description: "Version label of the tool that generated this response"
        schema_version:
            type: "string"
            example: "0.7.0"
            description: "Version label of this JSON-LD schema"
        datetime:
            type: "string"
            example: "2018-01-09 12:34:45"
            description: "ISO standard datetime string for the time that this response was generated"
        original_question_text:
            type: "string"
            example: "what proteins are affected by sickle cell anemia"
            description: "The original question text typed in by the user"
        restated_question_text:
            type: "string"
            example: "Which proteins are affected by sickle cell anemia?"
            description: "A precise restatement of the question, as understood by the Translator, for which the answer applies. The user should verify that the restated question matches the intent of their original question (it might not)."
        query_type_id:
            type: "string"
            example: "Q2"
            description: "The query type id if one is known for the query/response (as defined in https://docs.google.com/spreadsheets/d/18zW81wteUfOn3rFRVG0z8mW-ecNhdsfD_6s73ETJnUw/edit#gid=1742835901 )"
        terms:
            type: "object"
            example: "{ 'disease': 'malaria' }"
            description: "The is string of the query type id if one is known for the query/response"
        response_code:
            type: "string"
            example: "OK"
            description: "Set to OK for success, or some other short string to indicate and error (e.g., KGUnavailable, TermNotFound, etc.)"
        message:
            type: "string"
            example: "1 answer found"
            description: "Extended message denoting the success or mode of failure for the response"
        result_list:
            type: "array"
            items:
                $ref: "#/definitions/Result"
    """
    pass

@swagger.definition('Result')
class Result():
    """
    Result
    ---
    type: "object"
    description: "One of potentially several results or answers for a query"
    properties:
        id:
            type: "string"
            example: "http://rtx.ncats.io/api/rtx/v1/result/2345"
            description: "URI for this response"
        text:
            type: "string"
            example: "The genetic condition sickle cell anemia may provide protection\
            \ from cerebral malaria via genetic alterations of proteins HBB (P68871)\
            \ and HMOX1 (P09601)."
            description: "A free text description or comment from the reasoner about this answer"
        confidence:
            type: "number"
            format: "float"
            example: 0.9234
            description: "Confidence metric for this result, a value 0.0 (no confidence) and 1.0 (highest confidence)"
        result_type:
            type: "string"
            example: "answer"
            description: "One of several possible result types: 'individual query answer', 'neighborhood graph', 'type summary graph'"
        result_graph:
            $ref: "#/definitions/Graph"
    """
    pass

@swagger.definition('Graph')
class Graph():
    """
    Graph
    ---
    type: "object"
    description: "A graph (specification or result)."
    properties:
        nodes:
            type: "array"
            items:
                $ref: "#/definitions/Node"
        edges:
            type: "array"
            items:
                $ref: "#/definitions/Edge"
    """
    pass

@swagger.definition('Query')
class Query():
    """
    Query
    ---
    type: "object"
    required:
      - query_type_id
      - terms
    properties:
        original_question:
            type: "string"
            example: "What proteins are targeted by ibuprofen?"
            description: "Original question as it was typed in by the user"
        query_type_id:
            type: "string"
            example: "Q3"
            description: "RTX identifier for the specific query type"
        max_results:
            type: "integer"
            example: "100"
            description: "Maximum number of individual results to return"
        terms:
            type: "object"
            description: "Dict of terms needed by the specific query type"
            properties:
                chemical_substance:
                    type: "string"
                    example: "CHEBI:5855"
            additionalProperties: true
    """
    pass

@swagger.definition('Feedback')
class Feedback():
    """
    Feedback
    ---
    type: object
    properties:
        question_id:
            type: string
        answer_id:
            type: string
        accuracy:
            type: string
        impact:
            type: string
        notes:
            type: string
    """
    pass

@swagger.definition('Task')
class Task():
    """
    Task
    ---
    type: object
    properties:
        uuid: 
            type: string
            example: "000481a4-0a42-41a3-8d82-f957aa0242cd"
        name:
            type: string
            example: "manager.tasks.update_kg"
        state:
            type: string
            example: "STARTED"
        received:
            type: number
            example: 1527126644.7026913
        sent:
            type: number
        started:
            type: number
            example: 1527127749.5369344
        rejected:
            type: number
        succeeded:
            type: number
        failed:
            type: number
        retried:
            type: number
        revoked:
            type: number
        args:
            type: string
            example: "['e5762fc349dd4abd0145c41ac4d42f4c']"
        kwargs:
            type: string
            example: "{'question_id': '3mrYX07S7E8D', 'user_email': 'patrick@covar.com'}"
        eta:
            type: number
        expires:
            type: number
        retries:
            type: integer
            example: 0
        result:
            type: string
        exception:
            type: string
        timestamp:
            type: number
            example: 1527127749.5369344
        runtime:
            type: number
        traceback:
            type: string
        exchange:
            type: string
        routing_key:
            type: string
        clock:
            type: number
            example: 250648
        client:
            type: string
        root:
            type: string
            example: "000481a4-0a42-41a3-8d82-f957aa0242cd"
        root_id:
            type: string
            example: "000481a4-0a42-41a3-8d82-f957aa0242cd"
        parent: 
            type: string
        parent_id: 
            type: string
        children: 
            type: array
            example: []
    """
    pass

@swagger.definition('Question')
class Question():
    """
    Question
    ---
    id: Question
    properties:
        name:
            type: "string"
            description: "human-readable question name"
        natural:
            type: "string"
            description: "natural language English question"
        notes:
            type: "string"
            description: "notes about question"
        machine_question:
            $ref: "#/definitions/Graph"
    example:
        name: "Ebola--(gene)--(genetic_condition)"
        natural: "What genetic conditions might provide protection against Ebola?"
        notes: "#ebola #q1"
        machine_question:
            nodes:
              - id: 0
                type: disease
                identifiers: ["MONDO:0005737"]
              - id: 1
                type: gene
              - id: 2
                type: genetic_condition
            edges:
              - source_id: 0
                target_id: 1
              - source_id: 1
                target_id: 2
    """
    pass
    
@swagger.definition('Node')
class Node():
    """
    Node
    ---
    id: Node
    required:
        - id
        - name
    properties:
        id:
            type: string
        name:
            type: string
        type:
            type: string
        identifiers:
            type: array
            items:
                type: string
            default: []
    """
    pass

@swagger.definition('Edge')
class Edge():
    """
    Edge
    ---
    id: Edge
    required:
        - source_id
        - target_id
    properties:
        label:
            type: "string"
            example: "affects"
            description: "Higher-level relationship type of this edge"
        relation:
            type: "string"
            example: "affects"
            description: "Lower-level relationship type of this edge"
        source_id:
            type: "string"
            example: "http://omim.org/entry/603903"
            description: "Corresponds to the @id of source node of this edge"
        target_id:
            type: "string"
            example: "https://www.uniprot.org/uniprot/P00738"
            description: "Corresponds to the @id of target node of this edge"
        provided_by:
            type: "string"
            example: "OMIM"
            description: "A CURIE/URI for the knowledge source that defined this edge"
        confidence:
            type: "number"
            format: "float"
            example: 0.99
            description: "Confidence metric for this edge, a value 0.0 (no confidence) and 1.0 (highest confidence)"
        publications:
            type: "array"
            items:
                type: string
            example: ["PubMed:12345562"]
            description: "A list of CURIEs/URIs for publications associated with this edge"
        evidence_type:
            type: "string"
            example: "ECO:0000220"
            description: "A CURIE/URI for class of evidence supporting the statement made in an edge - typically a class from the ECO ontology"
        qualifiers:
            type: "string"
            example: "ECO:0000220"
            description: "Terms representing qualifiers that modify or qualify the meaning of the statement made in an edge"
        negated:
            type: "boolean"
            example: "true"
            description: "Boolean that if set to true, indicates the edge statement is negated i.e. is not true"
        min_length:
            type: integer
            default: 1
        max_length:
            type: integer
            default: 1
    """
    pass
    