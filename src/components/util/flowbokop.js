const _ = require('lodash');

// Determine nodeType for a node from returned graph from flowbokop /graph endpoint
const nodeType = node => (_.isEmpty(node.operation) ? 'input' : 'operation');

export { nodeType };
