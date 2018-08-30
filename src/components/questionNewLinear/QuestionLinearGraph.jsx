import React from 'react';

import QuestionGraphViewer from '../shared/QuestionGraphViewer';

const shortid = require('shortid');

class QuestionLinearGraph extends React.Component {
  constructor(props) {
    super(props);

  }

  getGraph() {
    // Translate the query list to a graph for display
    let q = this.props.machineQuestion.map(a => ({ ...a })); // Deep copy of array of objects 
    if (q == null || q.length === 0) {
      q = [];
    }
    // The nodes are fully specified by the query
    const nodes = q.map((q2) => {
      if (!(q2.label)) {
        q2.label = ' ';
      }
      return q2;
    });

    // Assume linear structure between the nodes
    const edges = [];
    for (let iNode = 0; iNode < (nodes.length - 1); iNode += 1) {
      edges.push({
        id: shortid.generate(),
        source_id: nodes[iNode].id,
        target_id: nodes[iNode + 1].id,
      });
    }

    const graph = { nodes, edges };
    return graph;
  }

  render() {
    const graph = this.getGraph();

    return (
      <QuestionGraphViewer
        graph={graph}
        concepts={this.props.concepts}
      />
    );
  }
}

export default QuestionLinearGraph;
