import React from 'react';
import { Row, Col, Panel, Button } from 'react-bootstrap';
import SubGraphViewer from '../shared/SubGraphViewer';

class AnswersetGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      renderGraph: false,
    };
  }
  render() {
    const bodyStyle = this.state.renderGraph ? { padding: 0 } : { minHeight: '100px'};

    return (
      <Row>
        <Col md={12}>
          <Panel>
            <Panel.Heading>
              <Panel.Title componentClass="h3">Aggregate Answer Graph</Panel.Title>
            </Panel.Heading>
            <Panel.Body style={bodyStyle}>
              {this.state.renderGraph &&
                <SubGraphViewer
                  subgraph={this.props.answersetGraph}
                  callbackOnGraphClick={() => {}}
                />
              }
              {!this.state.renderGraph &&
                <Button onClick={() => this.setState({ renderGraph: true })}>
                  Render Graph
                </Button>
              }
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    );
  }
}

export default AnswersetGraph;
