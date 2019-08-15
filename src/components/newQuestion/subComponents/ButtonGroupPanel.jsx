import React from 'react';
import { observer } from 'mobx-react';
import { ButtonGroup, Button } from 'react-bootstrap';

import FaPlusSquare from 'react-icons/lib/fa/plus-square';
import FaPlus from 'react-icons/lib/fa/plus';
import FaWrench from 'react-icons/lib/fa/wrench';

import { panelTypes } from '../../../stores/newQuestionStore';

const ButtonGroupPanel = observer(({ store, openJsonEditor }) => {
  const { isValidGraph } = store.graphValidationState;
  const atleastTwoNodes = store.panelState.filter(panel => store.isNode(panel) && !panel.deleted).length > 1;
  return (
    <div style={{
        position: 'absolute', left: '30px', top: '60px', zIndex: 99,
      }}
    >
      <ButtonGroup vertical>
        <Button onClick={() => store.newActivePanel(panelTypes.node)}>
          <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' New Node'}
        </Button>
        <Button
          onClick={() => store.newActivePanel(panelTypes.edge)}
          disabled={!atleastTwoNodes}
          title={!atleastTwoNodes ? 'Please create two nodes before connecting them with an edge' : ''}
        >
          <FaPlus style={{ verticalAlign: 'text-top' }} />{' New Edge'}
        </Button>
        <Button
          onClick={openJsonEditor}
          disabled={!isValidGraph}
          title={isValidGraph ? 'Manually edit JSON for machine question' : 'Manual JSON Editing disabled due to invalid Graph'}
        >
          <FaWrench style={{ verticalAlign: 'text-top' }} />
          {' Edit JSON'}
        </Button>
      </ButtonGroup>
    </div>
  );
});

export default ButtonGroupPanel;
