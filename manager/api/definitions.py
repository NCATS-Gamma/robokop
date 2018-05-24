from manager.setup import swagger

@swagger.definition('SimpleQuestion')
class SimpleQuestion():
    """
    Response
    ---
    type: "object"
    properties:
      name:
        type: "string"
        example: "Ebola--(gene)--(genetic_condition)"
        description: "human-readable question name"
      natural:
        type: "string"
        example: "What genetic conditions might provide protection against Ebola?"
        description: "natural language English question"
      notes:
        type: "string"
        example: "#ebola #q1"
        description: "notes about question"
      machine_question:
        description: "machine-readable question"
        schema:
            $ref: "#/definitions/MachineQuestion"
    """
    pass

@swagger.definition('MachineQuestion')
class MachineQuestion():
    """
    Machine Question
    ---
    type: "object"
    properties:
        nodes:
            type: "array"
            items:
                $ref: #/definitions/Node
        edges:
            type: "array"
            items:
                $ref: #/definitions/Edge
    """
    pass
    
@swagger.definition('Node')
class Node():
    """
    Node Object
    ---
    schema:
        id: Node
        required:
            - id
        properties:
            id:
                type: string
                required: true
            type:
                type: string
            name:
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
    Edge Object
    ---
    schema:
        id: Edge
        required:
            - start
            - end
        properties:
            start:
                type: string
            end:
                type: string
            min_length:
                type: integer
                default: 1
            max_length:
                type: integer
                default: 1
    """
    pass
    