import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import SubGraphViewer from './SubGraphViewer';
import SubGraphInfo from './SubGraphInfo';

// answerset={this.props.answerset}
// subgraph={this.props.answers[this.state.selectedSubGraphIndex]}
// subgraphs={this.props.answers}
// selectedSubgraphIndex={this.state.selectedSubGraphIndex}
// selectedEdge={this.state.selectedSubGraphEdge}
// callbackOnGraphClick={this.onGraphClick}

class AnswerExplorer extends React.Component {
  constructor(props) {
    super(props);

  }
  render() {
    return (
      <div>
        <h4>
          Answer {this.props.selectedSubgraphIndex + 1} of {this.props.subgraphs.length}
          <span className="pull-right">
            <Button onClick={()=>this.props.callbackOpenFeedback()} style={{ padding: '5px' }}>
              Feedback
            </Button>
          </span>
        </h4>
        <Row>
          <Col md={4}>
            <SubGraphViewer
              subgraph={this.props.subgraph}
              callbackOnGraphClick={this.props.callbackOnGraphClick}
            />
          </Col>
          <Col md={8}>
            <SubGraphInfo
              subgraphs={this.props.subgraphs}
              selectedSubgraphIndex={this.props.selectedSubgraphIndex}
              selectedEdge={this.props.selectedEdge}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default AnswerExplorer;
