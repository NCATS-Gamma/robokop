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
        <Row>
          <Col md={12}>
            <h4>
              Answer {this.props.selectedSubgraphIndex + 1}
              {this.props.enableFeedbackSubmit &&
                <span className="pull-right">
                  <Button onClick={()=>this.props.callbackOpenFeedback()} style={{ padding: '5px' }}>
                    Feedback
                  </Button>
                </span>
              }
            </h4>
            <SubGraphViewer
              subgraph={this.props.answer.result_graph}
              callbackOnGraphClick={this.props.callbackOnGraphClick}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            {this.props.selectedEdge}
          </Col>
        </Row>
      </div>
    );
  }
}

// <SubGraphInfo
//               subgraphs={this.props.subgraphs}
//               selectedSubgraphIndex={this.props.selectedSubgraphIndex}
//               selectedEdge={this.props.selectedEdge}
//             />

export default AnswerExplorer;
