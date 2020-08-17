import React from 'react';
import { Modal, ButtonGroup, Button } from 'react-bootstrap';
import { FaSave, FaTrash, FaUndo } from 'react-icons/fa';
import _ from 'lodash';

// import { panelTypes } from '../../../stores/newQuestionStore';
import HelpButton from '../../../components/shared/HelpButton';
import getNodeTypeColorMap from '../../../utils/colorUtils';
import EdgePanel from './EdgePanel';
import NodePanel from './NodePanel';
import './panels.css';

class NewQuestionPanelModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.getBackgroundColor = this.getBackgroundColor.bind(this);
  }

  getBackgroundColor(nodePanel) {
    const { questionStore } = this.props;
    // set the color of the node/edge panel header
    const panelColorMap = getNodeTypeColorMap(questionStore.concepts);
    if (nodePanel) {
      return { backgroundColor: panelColorMap(questionStore.activePanelState.type) };
    }
    // only find the node panels in questionStore state.
    const nodeList = questionStore.panelState.filter((panel) => panel.panelType === 'node');
    const type1 = (nodeList[questionStore.activePanelState.source_id] && nodeList[questionStore.activePanelState.source_id].type) || 'edge';
    const type2 = (nodeList[questionStore.activePanelState.target_id] && nodeList[questionStore.activePanelState.target_id].type) || 'edge';
    const color1 = panelColorMap(type1);
    const color2 = panelColorMap(type2);
    return { backgroundImage: `linear-gradient(80deg, ${color1} 50%, ${color2} 50%)`, borderRadius: '5px 5px 0px 0px' };
  }

  render() {
    const { questionStore } = this.props;
    const { activePanelState } = questionStore;
    const isNodePanel = activePanelState.panelType === 'node';
    const unsavedChanges = questionStore.isUnsavedChanges;
    const { isValid: isValidPanel } = questionStore.activePanelState;
    const isNewPanel = questionStore.activePanelInd === questionStore.panelState.length;
    const backgroundColor = this.getBackgroundColor(isNodePanel);
    return (
      <div>
        {activePanelState.panelType && (
          <Modal
            show={questionStore.showPanelModal}
            backdrop="static"
            onHide={questionStore.togglePanelModal}
          >
            <Modal.Header style={backgroundColor} closeButton>
              <Modal.Title style={{ height: '6%', display: 'inline-block' }}>
                {`${isNodePanel ? 'Node' : 'Edge'} ${activePanelState.panelName} `}
                <HelpButton link="nedgePanel" />
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: 300 }}>
              {isNodePanel ? (
                <NodePanel activePanel={activePanelState} />
              ) : (
                <EdgePanel activePanel={activePanelState} />
              )}
            </Modal.Body>
            <Modal.Footer>
              <ButtonGroup className="pull-right">
                {(questionStore.panelState.length > 0) && (
                  <Button onClick={questionStore.deleteActivePanel} title={`${isNewPanel ? 'Discard' : 'Delete'} current node`}>
                    <FaTrash style={{ verticalAlign: 'text-top' }} />{` ${isNewPanel ? 'Discard' : 'Delete'}`}
                  </Button>
                )}
                {!isNewPanel && (
                  <Button
                    onClick={questionStore.revertActivePanel}
                    disabled={!unsavedChanges}
                    title={unsavedChanges ? 'Undo unsaved changes' : 'No changes to undo'}
                  >
                    <FaUndo style={{ verticalAlign: 'text-top' }} />
                    {' Undo'}
                  </Button>
                )}
                {!_.isEmpty(activePanelState) && (
                  <Button
                    onClick={questionStore.saveActivePanel}
                    disabled={!unsavedChanges || !isValidPanel}
                    bsStyle={isValidPanel ? (unsavedChanges ? 'primary' : 'default') : 'danger'} // eslint-disable-line no-nested-ternary
                    title={isValidPanel ? (unsavedChanges ? 'Save changes' : 'No changes to save') : 'Fix invalid panel entries first'} // eslint-disable-line no-nested-ternary
                  >
                    <FaSave style={{ verticalAlign: 'text-top' }} />
                    {' Save'}
                  </Button>
                )}
              </ButtonGroup>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    );
  }
}

export default NewQuestionPanelModal;
