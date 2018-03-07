import React from 'react';

import { Row } from 'react-bootstrap';
import NodeTypes from '../questionNew/QuestionNewNodeTypes';

const shortid = require('shortid');

class QuestionGraphViewer extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
        <Row>
        <div style={{ background: 'tomato', minHeight: "300px" }}>
          <h2>Construction Plan:</h2>
          <h4>{`${this.props.graph.nodes.length} Concepts`}</h4>
          <h4>{`${this.props.graph.edges.length} Edges`}</h4>
        </div>
      </Row>
    );
  }
}

export default QuestionGraphViewer;
