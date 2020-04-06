import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Row, Col, Panel, OverlayTrigger, Popover, Checkbox } from 'react-bootstrap';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import FaAngleDown from 'react-icons/lib/fa/angle-down';

import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

import SubGraphViewer from '../shared/graphs/SubGraphViewer';

const shortid = require('shortid');

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
      overlayStyle={{ zIndex: 1061 }}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  );
};

@observer
class AnswersetGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hierarchical: '',
    };

    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleHierarchical = this.handleHierarchical.bind(this);
  }

  handleSliderChange(value) {
    this.props.store.updateNumKGNodes(value);
  }

  handleHierarchical(checked) {
    const horizon = checked ? 'hierarchical' : '';
    this.setState({ hierarchical: horizon });
  }

  render() {
    const { store } = this.props;
    const { hierarchical } = this.state;
    const answersetGraph = store.annotatedPrunedKnowledgeGraph;
    const sliderPopover = (
      <Popover id={shortid.generate()}>
        <div style={{ marginTop: '10px', width: '300px' }}>
          {store.isKgPruned() ? (
            `Pruned graph showing top ${store.numKGNodes} nodes`
          ) : (
            'Prune Graph'
          )}
          <Slider
            min={store.numQNodes}
            max={store.maxNumKGNodes}
            defaultValue={store.numKGNodes}
            onAfterChange={this.handleSliderChange}
            handle={handle}
          />
          <Checkbox checked={hierarchical} onChange={e => this.handleHierarchical(e.target.checked)}>Hierarchical</Checkbox>
        </div>
      </Popover>
    );
    return (
      <Row>
        <Col md={12}>
          <Panel style={{ marginTop: '10px' }}>
            <Panel.Heading style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Panel.Title componentClass="h3">Aggregate Graph</Panel.Title>
            </Panel.Heading>
            <Panel.Body style={{ height: '630px' }}>
              <div
                style={{
                  position: 'relative', minHeight: '200px', display: 'table', width: '100%',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '270px',
                    backgroundColor: '#fff',
                    boxShadow: '-2px 2px 5px 0px #7777777d',
                    zIndex: 100,
                  }}
                >
                  <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={sliderPopover}>
                    <div
                      style={{
                        width: '100%', textAlign: 'center', cursor: 'pointer', padding: '10px',
                      }}
                    >
                      Graph Options <FaAngleDown />
                    </div>
                  </OverlayTrigger>
                </div>
                <SubGraphViewer
                  subgraph={answersetGraph}
                  concepts={this.props.concepts}
                  layoutRandomSeed={Math.floor(Math.random() * 100)}
                  layoutStyle={hierarchical}
                  showSupport={false}
                  omitEdgeLabel
                  callbackOnGraphClick={() => {}}
                />
              </div>
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    );
  }
}

AnswersetGraph.propTypes = propTypes;

export default AnswersetGraph;
