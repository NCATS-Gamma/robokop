import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Panel, Button } from 'react-bootstrap';
import SubGraphViewer from '../shared/SubGraphViewer';

const propTypes = {
  concepts: PropTypes.arrayOf(PropTypes.string).isRequired,
  answersetGraph: PropTypes.object.isRequired,
  title: PropTypes.string,
}

const defaultProps = {
  title: 'Aggregate Answer Graph',
};

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
          <Panel style={{ marginTop: '10px' }}>
            <Panel.Heading>
              <Panel.Title componentClass="h3">{this.props.title}</Panel.Title>
            </Panel.Heading>
            <Panel.Body style={bodyStyle}>
              {this.state.renderGraph &&
                <SubGraphViewer
                  subgraph={this.props.answersetGraph}
                  concepts={this.props.concepts}
                  layoutRandomSeed={Math.floor(Math.random() * 100)}
                  showSupport={false}
                  omitEdgeLabel
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

AnswersetGraph.propTypes = propTypes;
AnswersetGraph.defaultProps = defaultProps;

export default AnswersetGraph;
