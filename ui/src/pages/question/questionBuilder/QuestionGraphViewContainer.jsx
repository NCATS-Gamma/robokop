import React, { useState } from 'react';
import { FaSpinner, FaPlusSquare } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';

import QuestionGraphView from '../../../components/shared/graphs/QuestionGraphView';
import NewQuestionPanelModal from '../panels/NewQuestionPanelModal';
import ButtonGroupPanel from '../subComponents/ButtonGroupPanel';
import QuestionJsonEditor from './QuestionJsonEditor';

import config from '../../../config.json';

const graphStates = {
  fetching: 'fetching',
  empty: 'empty',
  display: 'display',
  error: 'error',
};

function getHeight() {
  const h = window.innerHeight - 50;
  return `${h}px`;
}

export default function QuestionGraphViewContainer(props) {
  const { questionStore, height = getHeight(), width = '100%' } = props;
  const [showJsonEditor, toggleJsonEditor] = useState(false);

  function graphClickCallback(data) {
    if (data.nodes.length > 0) {
      questionStore.updateActivePanelFromNodeId(data.nodes[0]);
    } else if (data.edges.length > 0) {
      questionStore.updateActivePanelFromEdgeId(data.edges[0]);
    }
  }

  function saveJsonEditor({ data }) { // { data: this.state.data, isValid: this.state.isValid }
    try {
      questionStore.machineQuestionSpecToPanelState(data);
      toggleJsonEditor(!showJsonEditor);
    } catch (err) {
      console.error(err);
      // TODO: what did this used to be?
      // dialogMessage({
      //   title: 'Trouble Parsing Manually edited JSON',
      //   text: 'We ran in to problems parsing the user provided JSON. Please ensure that it is a valid MachineQuestion spec JSON file',
      //   buttonText: 'OK',
      //   buttonAction: () => {},
      // });
      // window.alert('Failed to load m Question template. Are you sure this is valid?');
      questionStore.setGraphState(graphStates.error);
    }
  }

  const graph = questionStore.machineQuestion;
  const showGraph = (!(graph === null) && (questionStore.graphState === graphStates.display));
  const showFetching = questionStore.graphState === graphStates.fetching;
  const notInitialized = questionStore.graphState === graphStates.empty;
  const numNodes = questionStore.panelState.length;
  const error = questionStore.graphState === graphStates.error;

  return (
    <div id="QuestionGraphViewContainer">
      <ButtonGroupPanel questionStore={questionStore} toggleJsonEditor={() => toggleJsonEditor(!showJsonEditor)} />
      {showGraph ? (
        <QuestionGraphView
          height={height}
          width={width}
          question={questionStore.machineQuestion}
          concepts={questionStore.concepts}
          graphState={questionStore.graphState}
          selectable
          graphClickCallback={graphClickCallback}
        />
      ) : (
        <div
          style={{
            height, display: 'table', width: '100%',
          }}
        >
          <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
            {showFetching && (
              <div>
                <FaSpinner className="icon-spin" style={{ marginRight: '10px', verticalAlign: 'text-top' }} />
                Graph update in progress... Please wait.
              </div>
            )}
            {notInitialized && (
              <Button bsSize="large" onClick={() => questionStore.newActivePanel('node')}>
                <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' Add Node'}
              </Button>
            )}
            {error && (
              <span>
                There was an error with the query graph specification
              </span>
            )}
          </div>
        </div>
      )}
      {(numNodes === 1 || numNodes === 2) && (
        <div style={{ position: 'absolute', top: '47%', right: '20%' }}>
          <Button bsSize="large" onClick={() => questionStore.newActivePanel(numNodes === 1 ? 'node' : 'edge')}>
            <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{` Add ${numNodes === 1 ? 'Node' : 'Edge'}`}
          </Button>
        </div>
      )}
      <NewQuestionPanelModal
        questionStore={questionStore}
      />
      <Modal
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
        show={showJsonEditor}
        dialogClassName="question-editor-modal"
      >
        <Modal.Body>
          <QuestionJsonEditor
            height={700}
            concepts={config.concepts}
            questionStore={questionStore}
            callbackSave={saveJsonEditor}
            callbackCancel={() => toggleJsonEditor(!showJsonEditor)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export { graphStates };
