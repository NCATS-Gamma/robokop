import numpy

def topological_sort(adj):

    N = adj.shape
    input_degree = numpy.sum(adj, axis=0)
    output_degree = numpy.sum(adj, axis=1)

    order = []
        
    for _ in range(N[0]-1):

        input_zero_inds, = numpy.where(input_degree == 0) # Nodes with input degree 0
        
        if input_zero_inds.shape[0] == 0:
            # If there is no node with input degree 0 then there must be a cylce
            raise Exception('There are no nodes with input degree 0 (the graph likely contains a cycle)')

        # Get the maximum output degree of these inputs
        raw_ind = output_degree[input_zero_inds].argmax()
        # Get the index into the original matrix
        ind = input_zero_inds[raw_ind]
        
        # This input is next
        order.append(ind)

        # Mark this node complete
        input_degree[ind] = -1

        # Reduce the input degree of anything that depends on this index
        depends_on_this = numpy.where(adj[ind,...])

        # Decrease input degree of dependent nodes
        input_degree[depends_on_this] = input_degree[depends_on_this] - 1

    return order