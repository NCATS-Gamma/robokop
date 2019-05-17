import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Panel } from 'react-bootstrap';
import SubGraphViewer from '../shared/graphs/SubGraphViewer';

const propTypes = {
  concepts: PropTypes.arrayOf(PropTypes.string).isRequired,
  answersetGraph: PropTypes.object.isRequired,
  title: PropTypes.string,
};

const defaultProps = {
  title: 'Aggregate Answer Graph',
};

class AnswersetGraph extends React.PureComponent {
  render() {
    const bodyStyle = { minHeight: '100px' };

    return (
      <Row>
        <Col md={12}>
          <Panel style={{ marginTop: '10px' }}>
            <Panel.Heading>
              <Panel.Title componentClass="h3">{this.props.title}</Panel.Title>
            </Panel.Heading>
            <Panel.Body style={bodyStyle}>
              <SubGraphViewer
                subgraph={this.props.answersetGraph}
                concepts={this.props.concepts}
                layoutRandomSeed={Math.floor(Math.random() * 100)}
                showSupport={false}
                omitEdgeLabel
                callbackOnGraphClick={() => {}}
              />
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
