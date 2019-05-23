import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Row, Col, Panel } from 'react-bootstrap';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import SubGraphViewer from '../shared/graphs/SubGraphViewer';

const propTypes = {
  concepts: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const { Handle } = Slider;

const handle = (props) => {
  const {
    value, dragging, index, ...restProps
  } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={`${value} Nodes`}
      visible={dragging}
      placement="top"
      key={index}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  );
};

@observer
class AnswersetGraph extends React.Component {
  constructor(props) {
    super(props);

    this.handleSliderChange = this.handleSliderChange.bind(this);
  }

  handleSliderChange(value) {
    this.props.store.updateNumKGNodes(value);
  }

  render() {
    const { store } = this.props;
    const answersetGraph = store.annotatedPrunedKnowledgeGraph;
    answersetGraph.node_list = answersetGraph.nodes;
    answersetGraph.edge_list = answersetGraph.edges;
    const bodyStyle = { minHeight: '100px' };
    const title = store.isKgPruned() ? `Pruned aggregate graph (Top ${store.numKGNodes} nodes)` : 'Aggregate Graph';

    return (
      <Row>
        <Col md={12}>
          <Panel style={{ marginTop: '10px' }}>
            <Panel.Heading style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Panel.Title componentClass="h3">{title}</Panel.Title>
              <div style={{ width: '330px', display: 'flex' }}>
                <h4 style={{ width: '140px', margin: '0 10px' }}>Prune Nodes:</h4>
                <Slider
                  min={store.numQNodes}
                  max={store.maxNumKGNodes}
                  defaultValue={store.numKGNodes}
                  onAfterChange={this.handleSliderChange}
                  handle={handle}
                />
              </div>
            </Panel.Heading>
            <Panel.Body style={bodyStyle}>
              <SubGraphViewer
                subgraph={answersetGraph}
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

export default AnswersetGraph;
