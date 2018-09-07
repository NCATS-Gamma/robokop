import numpy

from .curieset import CurieSet
from .operation import Operation
from .service import Service
from .util import topological_sort

class Workflow(Service):
    def __init__(self, *args, **kwargs):
        """Create a workflow.

        keyword arguments: connectivity, operations, output
        q = Workflow(kw0=value, ...)
        q = Workflow(struct, ...)
        """

        # initialize all properties
        self.output = None
        self.operations = []

        self.connectivity = None
        self.connectivity_graph_nodes = None
        self.operation_order = []

        Service.__init__(self, *args, **kwargs)

        # apply json properties to existing attributes
        if args:
            struct = args[0]
            if "options" in struct:
                options = struct["options"]
                # assume json specification
                # {
                #    output: string or list of strings
                #    operations: objects specifying operations
                # }
                if "output" in options:
                    self.output = options["output"]

                if "operations" in options:
                    self.operations = [Operation(op) for op in options["operations"]]

        # override any json properties with the named ones
        attributes = self.__dict__.keys()
        for key in kwargs:
            if key in attributes:
                setattr(self, key, kwargs[key])
            else:
                # warnings.warn("Keyword argument {} ignored.".format(key))
                pass

        # In the rare event that you have supplied connectivity we will just trust you that you are initialized
        if not self.connectivity:
            self.parse_graph()
        
    def run(self):
        
        variables = {}
        for node_ind in self.operation_order:
            print(variables)
            node = self.connectivity_graph_nodes[node_ind]

            if node["is_input"]:
                in_name = node["name"]
                variables[in_name] = self.input.get_list(in_name)
                continue

            if node["is_output"]:
                continue
            
            # An operation that requires some input and output
            # Collect required variables
            input_dict = {}
            for in_name in node["operation"].input:
                if not in_name in variables:
                    raise Exception(f"Required input {in_name} was not found for the operation {node['operation']}, perhaps there is a problem with the graph")

                input_dict[in_name] = variables[in_name]
            
            # Parse into a curie set
            input_curies = CurieSet(input_dict)
            
            # Run the operation
            output_curies, err_status, err_message = node["operation"].run(input_curies)

            # At this point we might have a curie object, a list of curie objects, or a dict with curie lists
            # This is handeld pretty well by the CurieSet constructor
            
            # Store the output for future use
            variables[node["operation"].output] = CurieSet(output_curies)

        
        # With variables now fully populated we can now find the desired outputs
        output_dict = {}
        ouput_variables = self.output
        if isinstance(ouput_variables, str):
            ouput_variables = [ouput_variables]

        for out_name in ouput_variables:
            if out_name == "all":
                output_dict = variables
                break
            if not out_name in variables:
                raise Exception(f"Required output {out_name} was not found, perhaps there is a problem with the graph")
            output_dict[out_name] = variables[out_name]

        # All set, let's just package this up into a curie set
        output_curies = CurieSet(output_dict)
        
        return output_curies.to_json()

    def num_operations(self):
        return len(self.operations)

    def parse_graph(self):
        '''
        The connectivity matrix uses the nodes to indicate the inputs operations outputs of the workflow
        Each named input is given a node
        The last node is then reserved for the output 
        Each row indicates what nodes to give input to
        Each column then indicates dependencies
        
        A single operation with a single input and output would look like this:
          [ 0, 1, 0
            0, 0, 1
            0, 0, 0]
        Two operations in parallel with a single input and two outputs would look like this:
          [ 0, 1, 1, 0
            0, 0, 0, 1
            0, 0, 0, 1
            0, 0, 0, 0]
        
        By construction:
          The diagonal is all zeros
          The last row is all zeros
        
        Topological sorting is then applied to get the order in which operations should be done.
        '''
        num_input_lists = self.input.num_lists()
        num_connectivity_nodes = self.num_operations() + num_input_lists + 1
        self.connectivity = numpy.zeros((num_connectivity_nodes, num_connectivity_nodes))

        self.connectivity_graph_nodes = []
        for in_var in self.input.names():
            node = {"is_input": True, "is_output": False, "name": in_var, "operation": []}
            self.connectivity_graph_nodes.append(node)

        for op in self.operations:
            node = {"is_input": False, "is_output": False, "name": op.label, "operation": op}
            self.connectivity_graph_nodes.append(node)

        output_node = {"is_input": False, "is_output": True, "name": "output", "operation": []}
        self.connectivity_graph_nodes.append(output_node)

        # For each operation find the inputs 
        for ind, node in enumerate(self.connectivity_graph_nodes):
            if node["is_input"]:
                # No need to find required inputs, this is an input
                continue
            
            if node["is_output"]:
                # all is a magic output variable that yields all variables
                if self.output == "all":
                    self.connectivity[...,ind] = 1
                    continue
                # otherwise find just the request output
                input_variables = self.output # the requested outputs are the required inputs of the output node
            else:
                # A regular operation
                input_variables = node["operation"].input

            # Assert a list of required input variables
            if isinstance(input_variables, str):
                input_variables = [input_variables]

            # For each declared input
            for in_var in input_variables:
                # Find the index of the operation that supplies this input as the output
                # Note that this searches over the operations list which does not include inputs and outputs
                # Therefore there is special logical below and modified indexing into connectivity
                source_inds = self.find_input_origin(in_var)

                if len(source_inds) == 1:
                    # We found the requested input exactly once
                    self.connectivity[num_input_lists + source_inds[0], ind] = 1
                if len(source_inds) > 1:
                    # We found the requested input more than once -> Error
                    raise Exception(f"Variable {in_var} has been declared more than once")
                if len(source_inds) < 1:
                    # We did not find the requested input, maybe its one of the inputs to the workflow
                    if self.input.has_list(in_var):
                        # It's in the input list, mark that
                        input_ind = self.input.get_list_ind(in_var)
                        self.connectivity[input_ind, ind] = 1
                    else:
                        # Can't find the requested input anywhere
                        raise Exception(f"Could not find variable {in_var}")
        

        self.operation_order = topological_sort(self.connectivity)

    def find_input_origin(self, varName):
        return [ind for ind, op in enumerate(self.operations) if op.output == varName]

    def graph(self):
        # Assume we have connnectivity and connectivity_graph_nodes all in order

        nodes = []
        for i, cn in enumerate(self.connectivity_graph_nodes):
            if cn['is_input']:
                n = {
                    'id': i,
                    'name': cn['name'],
                    'operation': {},
                }
                nodes.append(n)
                continue
            if cn['is_output']:
                continue

            op = cn['operation']
            n = {
                'id': i,
                'name': op.label,
                'operation': {
                    'service': op.service.url,
                    'options': op.service.options
                },
            }
            nodes.append(n)
        
        edges = []
        for i, cn in enumerate(self.connectivity_graph_nodes):
            if cn['is_output']:
                continue

            for j, dn in enumerate(self.connectivity_graph_nodes):
                if dn['is_output']:
                     continue
                if self.connectivity[i, j]:
                    e = {
                        'source_id': i,
                        'target_id': j
                    }
                    edges.append(e)
        
        return {'nodes': nodes, 'edges': edges}
