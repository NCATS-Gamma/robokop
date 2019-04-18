import React from 'react';
import { observer } from 'mobx-react';
import { ButtonGroup, Button } from 'react-bootstrap';

import FaFloppyO from 'react-icons/lib/fa/floppy-o';
import FaTrash from 'react-icons/lib/fa/trash';
import FaUndo from 'react-icons/lib/fa/rotate-left';
import FaPlusSquare from 'react-icons/lib/fa/plus-square';
import FaPlus from 'react-icons/lib/fa/plus';
import FaWrench from 'react-icons/lib/fa/wrench';

import { panelTypes } from '../../stores/newQuestionStore';

const _ = require('lodash');

const ButtonGroupPanel = observer(({ store, openJsonEditor }) => {
  const unsavedChanges = store.isUnsavedChanges;
  const { isValid: isValidPanel } = store.activePanelState;
  const { isValidGraph } = store.graphValidationState;
  const atleastTwoNodes = store.panelState.filter(panel => store.isNode(panel) && !panel.deleted).length > 1;
  const isNewPanel = store.activePanelInd === store.panelState.length;
  return (
    <div style={{ position: 'relative', margin: '10px 0px' }}>
      <ButtonGroup>
        {!_.isEmpty(store.activePanelState) &&
          <Button
            onClick={store.saveActivePanel}
            disabled={!unsavedChanges || !isValidPanel}
            bsStyle={isValidPanel ? (unsavedChanges ? 'primary' : 'default') : 'danger'} // eslint-disable-line no-nested-ternary
            title={isValidPanel ? (unsavedChanges ? 'Save changes' : 'No changes to save') : 'Fix invalid panel entries first'} // eslint-disable-line no-nested-ternary
          >
            <FaFloppyO style={{ verticalAlign: 'text-top' }} />
            {' Save'}
          </Button>
        }
        {!isNewPanel &&
          <Button
            onClick={store.revertActivePanel}
            disabled={!unsavedChanges}
            title={unsavedChanges ? 'Undo unsaved changes' : 'No changes to undo'}
          >
            <FaUndo style={{ verticalAlign: 'text-top' }} />
            {' Undo'}
          </Button>
        }
        {(store.panelState.length > 0) &&
          <Button onClick={store.deleteActivePanel} title={`${isNewPanel ? 'Discard' : 'Delete'} current node`}>
            <FaTrash style={{ verticalAlign: 'text-top' }} />{` ${isNewPanel ? 'Discard' : 'Delete'}`}
          </Button>
        }
        <Button onClick={() => store.newActivePanel(panelTypes.node)}>
          <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' New Node'}
        </Button>
        {atleastTwoNodes &&
          <Button onClick={() => store.newActivePanel(panelTypes.edge)}>
            <FaPlus style={{ verticalAlign: 'text-top' }} />{' New Edge'}
          </Button>
        }
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
