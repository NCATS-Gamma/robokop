import React from 'react';

import NodeTypes from '../questionNew/QuestionNewNodeTypes';

const shortid = require('shortid');

class QuestionGraphViewer extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div style={{ background: 'tomato' }}>
        <h2>Construction Plan:</h2>
        <h4>{`${this.props.graph.nodes.length} Concepts`}</h4>
        <h4>{`${this.props.graph.edges.length} Edges`}</h4>
      </div>
    );
  }
}

export default QuestionGraphViewer;
