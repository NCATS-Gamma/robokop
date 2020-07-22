import React from 'react';
import { observer } from 'mobx-react';
import { ButtonGroup, Button } from 'react-bootstrap';

import { FaPlusSquare, FaPlus } from 'react-icons/fa';

import { panelTypes } from '../../../stores/newQuestionStore';

const ButtonGroupPanel = observer(({ store, toggleJsonEditor }) => {
  const atleastTwoNodes = store.panelState.filter(panel => store.isNode(panel) && !panel.deleted).length > 1;
  return (
    <div>
      {store.panelState.length > 0 &&
        <div style={{
            position: 'absolute', left: '30px', top: '60px', zIndex: 99,
          }}
        >
          <ButtonGroup vertical>
            <Button onClick={() => store.newActivePanel(panelTypes.node)}>
              <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' Add Node'}
            </Button>
            <Button
              onClick={() => store.newActivePanel(panelTypes.edge)}
              disabled={!atleastTwoNodes}
              title={!atleastTwoNodes ? 'Please create two nodes before connecting them with an edge' : ''}
            >
              <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Edge'}
            </Button>
          </ButtonGroup>
        </div>
      }
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
});

export default ButtonGroupPanel;
