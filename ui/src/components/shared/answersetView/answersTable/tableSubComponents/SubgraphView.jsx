import React, { useState, useEffect } from 'react';
import {
  Modal, OverlayTrigger, Popover, Checkbox,
} from 'react-bootstrap';
import { FaAngleDown } from 'react-icons/fa';

import shortid from 'shortid';

import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

import SubGraphViewer from '../../../graphs/SubGraphViewer';
import Loading from '../../../../loading/Loading';
import AnswerExplorerInfo from '../../../answerExplorer/AnswerExplorerInfo';

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

export default function SubgraphView(props) {
  const {
    messageStore, answersTableStore, concepts,
  } = props;
  const { rowData, loadedGraph } = answersTableStore;
  const [showModal, toggleModal] = useState(false);
  const [hierarchical, setHierarchy] = useState('');
  let sliderPopover = <div>No answerset</div>;
  const maxSetNodes = messageStore.getMaxNumAgNodes(rowData.id) || 0;

  function onGraphClick(event) {
    if (event.edges.length !== 0) { // Clicked on an Edge
      answersTableStore.setSelectedEdge(event.edgeObjects[0]);
      toggleModal(true);
    } else { // Reset things since something else was clicked
      answersTableStore.setSelectedEdge(null);
      toggleModal(false);
    }
  }

  function handleSliderChange(value) {
    messageStore.updateNumAgNodes(value);
    answersTableStore.setLoadedGraph(false);
  }

  function handleHierarchical(checked) {
    const horizon = checked ? 'hierarchical' : '';
    setHierarchy(horizon);
  }

  useEffect(() => {
    if (loadedGraph) {
      sliderPopover = (
        <Popover id={shortid.generate()}>
          <div style={{ marginTop: '10px', width: '300px' }}>
            {messageStore.isAgPruned(rowData.id) ? (
              `Pruned graph showing top ${messageStore.numAgSetNodes} set nodes`
            ) : (
              'Prune Graph'
            )}
            <Slider
              min={1}
              max={maxSetNodes}
              defaultValue={messageStore.numAgSetNodes}
              onAfterChange={handleSliderChange}
              handle={handle}
            />
            <Checkbox checked={hierarchical} onChange={(e) => handleHierarchical(e.target.checked)}>Hierarchical</Checkbox>
          </div>
        </Popover>
      );
    }
  }, [loadedGraph]);

  return (
    <>
      {loadedGraph ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: '270px',
              backgroundColor: '#fff',
              boxShadow: '-2px 2px 5px 0px #7777777d',
              zIndex: 100,
            }}
          >
            <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={sliderPopover}>
              <div
                style={{
                  width: '100%', textAlign: 'center', cursor: 'pointer', padding: '10px', fontSize: '12px',
                }}
              >
                {'Graph Options '}
                <FaAngleDown />
              </div>
            </OverlayTrigger>
          </div>
          <SubGraphViewer
            subgraph={answersTableStore.graph}
            concepts={concepts}
            layoutRandomSeed={Math.floor(Math.random() * 100)}
            layoutStyle={hierarchical}
            callbackOnGraphClick={onGraphClick}
            showSupport
            varyEdgeSmoothRoundness
            omitEdgeLabel={false}
            height={350}
          />
          <Modal
            show={showModal}
            onHide={() => toggleModal(false)}
            container={this}
            bsSize="large"
            aria-labelledby="AnswerExplorerModal"
          >
            <Modal.Header closeButton>
              <Modal.Title id="AnswerExplorerModalTitle">Edge Explorer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <AnswerExplorerInfo
                graph={answersTableStore.graph}
                selectedEdge={answersTableStore.selectedEdge}
                concepts={concepts}
              />
            </Modal.Body>
          </Modal>
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
