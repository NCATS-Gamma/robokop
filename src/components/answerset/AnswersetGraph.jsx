import React from 'react';
import { Row, Col, Panel } from 'react-bootstrap';
import SubGraphViewer from '../shared/SubGraphViewer';

class AnswersetGraph extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Row>
        <Col md={12}>
          <Panel>
            <Panel.Heading>
              <Panel.Title componentClass="h3">Aggregate Answer Graph</Panel.Title>
            </Panel.Heading>
            <Panel.Body style={{ padding: 0 }}>
              <SubGraphViewer
                subgraph={this.props.answersetGraph}
                callbackOnGraphClick={() => {}}
              />
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    );
  }
}

export default AnswersetGraph;
