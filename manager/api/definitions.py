from manager.setup import swagger

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
            example: null,
        started:
            type: number
            example: 1527127749.5369344
        rejected:
            type: number
            example: null
        succeeded:
            type: number
            example: null
        failed:
            type: number
            example: null
        retried:
            type: number
            example: null
        revoked:
            type: number
            example: null
        args:
            type: string
            example: "['e5762fc349dd4abd0145c41ac4d42f4c']"
        kwargs:
            type: string
            example: "{'question_id': '3mrYX07S7E8D', 'user_email': 'patrick@covar.com'}"
        eta:
            type: number
            example: null
        expires:
            type: number
            example: null
        retries:
            type: integer
            example: 0
        result:
            type: string
            example: null
        exception:
            type: string
            example: null
        timestamp:
            type: number
            example: 1527127749.5369344
        runtime:
            type: number
            example: null
        traceback:
            type: string
            example: null
        exchange:
            type: string
            example: null
        routing_key:
            type: string
            example: null
        clock:
            type: number
            example: 250648
        client:
            type: string
            example: null
        root:
            type: string
            example: "000481a4-0a42-41a3-8d82-f957aa0242cd"
        root_id:
            type: string
            example: "000481a4-0a42-41a3-8d82-f957aa0242cd"
        parent: 
            type: string
            example: null
        parent_id: 
            type: string
            example: null
        children: 
            type: array
            example: []
    """
    pass

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
    