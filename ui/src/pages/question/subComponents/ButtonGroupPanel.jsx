import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';

import { FaPlusSquare, FaPlus } from 'react-icons/fa';

// import { panelTypes } from '../../../stores/newQuestionStore';

/**
 * Button group on Query graph editor
 * @param {Object} panelStore new question panel custom hook
 * @param {function} toggleJsonEditor function to close the advanced json editor
 */
export default function ButtonGroupPanel({ panelStore, toggleJsonEditor }) {
  const atleastTwoNodes = panelStore.query_graph.nodes.filter((node) => !node.deleted).length >= 2;
  return (
    <>
      {panelStore.query_graph.nodes.length > 0 && (
        <div
          style={{
            position: 'absolute', left: '30px', top: '60px', zIndex: 99,
          }}
        >
          <ButtonGroup vertical>
            <Button onClick={() => panelStore.openPanel('node')}>
              <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' Add Node'}
            </Button>
            <Button
              onClick={() => panelStore.openPanel('edge')}
              disabled={!atleastTwoNodes}
              title={!atleastTwoNodes ? 'Please create two nodes before connecting them with an edge' : ''}
            >
              <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Edge'}
            </Button>
          </ButtonGroup>
        </div>
      )}
      <Button
        style={{
          position: 'absolute', left: '10px', bottom: '0px', zIndex: 99,
        }}
        bsSize="xsmall"
        onClick={toggleJsonEditor}
        bsStyle="link"
      >
        <u>Advanced</u>
      </Button>
    </>
  );
}
