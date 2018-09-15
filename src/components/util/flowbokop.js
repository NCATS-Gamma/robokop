// Determine nodeType for a node from returned graph from flowbokop /graph endpoint
const nodeType = (node) => {
  if (node.is_input) {
    return 'input';
  }
  if (node.is_output) {
    return 'output';
  }
  return 'operation';
};

export { nodeType };
