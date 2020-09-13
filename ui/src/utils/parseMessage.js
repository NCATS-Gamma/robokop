/**
 * A Reasoner API Standard Message
 * @typedef {Object} Message
 * @property {Object} knowledge_graph a graph containing nodes and edges
 * @property {Object} query_graph a graph containing nodes and edges
 * @property {Array} results an array of results
 */

/**
 * Convert a message into the format Robokop can use.
 * @param {Object} message a Reasoner API or Messenger standard message
 * @returns {Message} A Reasoner API standard message
 */
export default function parseMessage(message) {
  if (typeof message !== 'object') {
    throw SyntaxError("The uploaded message isn't a valid JSON object");
  }

  if (!('knowledge_graph' in message)) {
    throw ReferenceError('The uploaded message needs to have a knowledge_graph');
  }

  // This is a simple name change
  if ('question_graph' in message) {
    message.query_graph = message.question_graph;
    delete message.question_graph;
  }

  // Result node_bindings should be an array of qg_ids and kg_ids
  if ('results' in message) {
    if (!Array.isArray(message.results[0].node_bindings)) {
      message.answers = message.results;
      delete message.results;
    }
  }

  if ('answers' in message) {
    message.answers.forEach((answer) => {
      const convertedEdgeBindings = [];
      Object.keys(answer.edge_bindings).forEach((qg_id) => {
        const kg_ids = [];
        answer.edge_bindings[qg_id].forEach((kg_id) => {
          kg_ids.push(kg_id);
        });
        convertedEdgeBindings.push({
          qg_id,
          kg_id: kg_ids,
        });
      });
      answer.edge_bindings = convertedEdgeBindings;
      const convertedNodeBindings = [];
      Object.keys(answer.node_bindings).forEach((qg_id) => {
        const kg_ids = [];
        answer.node_bindings[qg_id].forEach((kg_id) => {
          kg_ids.push(kg_id);
        });
        convertedNodeBindings.push({
          qg_id,
          kg_id: kg_ids,
        });
      });
      answer.node_bindings = convertedNodeBindings;
    });
    message.results = message.answers;
    delete message.answers;
  }

  if (!message.results || message.results.length === 0) {
    throw RangeError('The uploaded message needs to have some results');
  }

  return message;
}
