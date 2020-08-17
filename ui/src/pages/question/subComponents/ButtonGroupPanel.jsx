import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';

import { FaPlusSquare, FaPlus } from 'react-icons/fa';

// import { panelTypes } from '../../../stores/newQuestionStore';

const ButtonGroupPanel = ({ questionStore, toggleJsonEditor }) => {
  const atleastTwoNodes = questionStore.panelState.filter((panel) => questionStore.isNode(panel) && !panel.deleted).length > 1;
  return (
    <div>
      {questionStore.panelState.length > 0 && (
        <div
          style={{
            position: 'absolute', left: '30px', top: '60px', zIndex: 99,
          }}
        >
          <ButtonGroup vertical>
            <Button onClick={() => questionStore.newActivePanel('node')}>
              <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' Add Node'}
            </Button>
            <Button
              onClick={() => questionStore.newActivePanel('edge')}
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
    </div>
  );
};

export default ButtonGroupPanel;
