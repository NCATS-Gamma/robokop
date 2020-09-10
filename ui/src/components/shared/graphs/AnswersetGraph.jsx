import React, { useState, useEffect } from 'react';
import {
  Row, Col, Panel, OverlayTrigger, Popover, Checkbox,
} from 'react-bootstrap';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import { FaAngleDown } from 'react-icons/fa';
import shortid from 'shortid';

import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

import SubGraphViewer from './SubGraphViewer';

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

/**
 * Answerset Graph
 * @param {array} concepts an array of available node types
 * @param {object} messageStore the messageStore custom hook
 */
export default function AnswersetGraph({ concepts, messageStore }) {
  const [hierarchical, toggleHierarchical] = useState(false);
  const [subgraph, updateSubGraph] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    updateSubGraph(messageStore.annotatedPrunedKnowledgeGraph());
  }, []);
  const sliderPopover = (
    <Popover id={shortid.generate()}>
      <div style={{ marginTop: '10px', width: '300px' }}>
        {messageStore.isKgPruned() ? (
          `Pruned graph showing top ${messageStore.numKGNodes} nodes`
        ) : (
          'Prune Graph'
        )}
        <Slider
          min={messageStore.numQNodes}
          max={messageStore.maxNumKGNodes}
          defaultValue={messageStore.numKGNodes}
          onAfterChange={(value) => messageStore.updateNumKGNodes(value)}
          handle={handle}
        />
        <Checkbox checked={hierarchical} onChange={(e) => toggleHierarchical(e.target.checked)}>Hierarchical</Checkbox>
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
                subgraph={subgraph}
                concepts={concepts}
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
