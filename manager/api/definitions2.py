"""Definitions following Translator Interchange API specification."""
from manager.setup import swagger


@swagger.definition('QNode')
class QNode():
    """
    Minimal node specification
    ---
    required:
        - id
    properties:
        id:
            type: string
            description: "Internal ID of this node"
        type:
            type: string
            description: "Optional biolink-model type of this node"
        curie:
            type: string
            description: "Optional curie of this node"
        set:
            type: boolean
            description: "Flag indicating whether node should be collapsed in answers"
    """


@swagger.definition('QEdge')
class QEdge():
    """
    Minimal edge specification
    ---
    type: object
    required:
        - id
        - source_id
        - target_id
    properties:
        id:
            type: string
            description: "Internal ID of this edge"
        type:
            type: string
            description: "Optional relationship type of this edge"
        source_id:
            type: string
            description: "Internal ID of source node of this edge"
        target_id:
            type: string
            description: "Internal ID of target node of this edge"
    """


@swagger.definition('QGraph')
class QGraph():
    """
    Graph representing the minimal question specification
    ---
    type: object
    properties:
        nodes:
            type: array
            items:
                $ref: "#/definitions/QNode"
        edges:
            type: array
            items:
                $ref: "#/definitions/QEdge"
    """


@swagger.definition('KNode')
class KNode():
    """
    Node in the knowledge graph
    ---
    type: object
    required:
        - id
    properties:
        id:
            description: "CURIE identifier for this node"
            type: string
        uri:
            description: "URI identifier for this node"
            type: string
        name:
            description: "Formal name of the entity"
            type: string
        type:
            description: "Entity type of this node (e.g., protein, disease, etc.)"
            type: string
        description:
            description: "One to three sentences of description/definition of this entity"
            type: string
        symbol:
            description: "Short abbreviation or symbol for this entity"
            type: string
        node_attributes:
            description: "A list of arbitrary attributes for the node"
            type: array
            items:
                $ref: "#/definitions/KNode_attribute"
    additionalProperties: true
    """


@swagger.definition('KNode_attribute')
class KNode_attribute():
    """
    Generic attribute for a node
    ---
    type: object
    properties:
        type:
            description: "Entity type of this attribute"
            type: string
        name:
            description: "Formal name of the attribute"
            type: string
        value:
            description: "Value of the attribute"
            type: string
        url:
            description: "A URL corresponding to this attribute"
            type: string
    additionalProperties: true
    """


@swagger.definition('KEdge')
class KEdge():
    """
    Edge in the knowledge graph
    ---
    type: object
    required:
        - id
        - type
        - source_id
        - target_id
    properties:
        id:
            description: "Unique ID for this edge"
            type: string
        type:
            type: string
            description: "Higher-level relationship type of this edge"
        relation:
            type: string
            description: "Lower-level relationship type of this edge"
        source_id:
            type: string
            description: "Corresponds to the @id of source node of this edge"
        target_id:
            type: string
            description: "Corresponds to the @id of target node of this edge"
        is_defined_by:
            type: string
            description: "A CURIE/URI for the translator group that made the KG"
        provided_by:
            type: string
            description: "A CURIE/URI for the knowledge source that defined this edge"
        confidence:
            type: number
            format: float
            description: "Confidence metric for this edge, a value 0.0 (no confidence) and 1.0 (highest confidence)"
        publications:
            type: string
            description: "A CURIE/URI for publications associated with this edge"
        evidence_type:
            type: string
            example: "ECO:0000220"
            description: "A CURIE/URI for class of evidence supporting the statement made in an edge - typically a class from the ECO ontology"
        qualifiers:
            type: string
            description: "Terms representing qualifiers that modify or qualify the meaning of the statement made in an edge"
        negated:
            type: boolean
            description: "Boolean that if set to true, indicates the edge statement is negated i.e. is not true"
    """


@swagger.definition('KGraph')
class KGraph():
    """
    Graph representing knowledge relevant to a specific question
    ---
    type: object
    properties:
        nodes:
            type: array
            items:
                $ref: "#/definitions/KNode"
        edges:
            type: array
            items:
                $ref: "#/definitions/KEdge"
    """


@swagger.definition('Answer')
class Answer():
    """
    Map from question node and edge IDs to knowledge-graph entity identifiers and relationship references
    ---
    type: object
    properties:
        node_bindings:
            additionalProperties:
            oneOf:
                - type: string
                - type: array
                  items:
                      type: string
        edge_bindings:
            additionalProperties:
            oneOf:
                - type: string
                - type: array
                  items:
                      type: string
    """


@swagger.definition('Options')
class Options():
    """
    Operation-/module-specific options
    ---
    type: object
    additionalProperties: true
    """


@swagger.definition('RemoteKGraph')
class RemoteKGraph():
    """
    Pointer to remote knowledge graph
    ---
    type: object
    required:
      - url
    properties:
      url:
        type: string
      credentials:
        $ref: '#/definitions/Credentials'
    """


@swagger.definition('Credentials')
class Credentials():
    """
    Credentials
    ---
    type: object
    required:
      - username
      - password
    properties:
      username:
        type: string
      password:
        type: string
    """


@swagger.definition('SimilarityResult')
class SimilarityResult():
    """
    Similarity result
    ---
    type: array
    items:
        type: object
        properties:
            id:
                type: string
            name:
                type: string
    """


@swagger.definition('ex_yanked')
class ex_yanked():
    """
    Yanked example
    ---
    value:
        question_graph:
            nodes:
              - id: "n00"
                type: "disease"
                curie: "MONDO:0005737"
              - id: "n01"
                type: "gene"
            edges:
              - id: "e00"
                source_id: "n00"
                target_id: "n01"
        knowledge_graph:
            nodes:
              - id: "MONDO:0005737"
              - id: "HGNC:7897"
            edges:
              - target_id: "HGNC:7897"
                source_id: "MONDO:0005737"
                publications: []
                id: "5579d0ec3e69cf5bd79fd643942d8536"
                type: "disease_to_gene_association"
        answers:
          - node_bindings:
                n00: "MONDO:0005737"
                n01: "HGNC:7897"
            edge_bindings:
                e00: "5579d0ec3e69cf5bd79fd643942d8536"
    """


@swagger.definition('Message')
class Message():
    """
    Message passed from one module to the next
    ---
    type: object
    required:
      - question_graph
      - knowledge_graph
      - answers
    properties:
      question_graph:
        $ref: '#/definitions/QGraph'
      knowledge_graph:
        oneOf:
          - $ref: '#/definitions/KGraph'
          - $ref: '#/definitions/RemoteKGraph'
      answers:
        type: array
        items:
          $ref: '#/definitions/Answer'
      options:
        $ref: '#/definitions/Options'
    example:
      question_graph:
        nodes:
          - id: "n00"
            type: "disease"
            curie: "MONDO:0005737"
          - id: "n01"
            type: "gene"
          - id: "n02"
            type: genetic_condition
        edges:
          - id: "e00"
            source_id: "n00"
            target_id: "n01"
          - id: "e01"
            source_id: "n01"
            target_id: "n02"
      knowledge_graph:
        nodes:
          - id: "MONDO:0005737"
            name: "Ebola hemorrhagic fever"
            type: "disease"
        edges: []
      answers:
        - node_bindings:
            n00: "MONDO:0005737"
          edge_bindings:
            e00: "f30686d3a5edb8d62e319fa34920fec9"
    """
