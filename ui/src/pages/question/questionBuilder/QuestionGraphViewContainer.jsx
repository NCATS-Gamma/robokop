import React, { useState, useEffect } from 'react';
import { FaSpinner, FaPlusSquare } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';

import QuestionGraphView from '../../../components/shared/graphs/QuestionGraphView';
import NewQuestionPanelModal from '../panels/NewQuestionPanelModal';
import ButtonGroupPanel from '../subComponents/ButtonGroupPanel';
import QuestionJsonEditor from './QuestionJsonEditor';

import useNewQuestionPanel from './useNewQuestionPanel';

import config from '../../../config.json';

// const graphStates = {
//   fetching: 'fetching',
//   empty: 'empty',
//   display: 'display',
//   error: 'error',
// };

function getHeight() {
  const h = window.innerHeight - 50;
  return `${h}px`;
}

/**
 * Question Graph View Container
 * @param {Object} questionStore new question custom hook
 * @param {Number} height height of the Question Graph
 * @param {Number} width width of the Question Graph
 */
export default function QuestionGraphViewContainer(props) {
  const { questionStore, height = getHeight(), width = '100%' } = props;
  const [showJsonEditor, toggleJsonEditor] = useState(false);
  const [showGraph, toggleGraph] = useState(false);
  const panelStore = useNewQuestionPanel();

  function graphClickCallback(data) {
    if (data.nodes.length > 0) {
      // const clickedNode = questionStore.getNode(data.nodes[0]);
      // questionStore.updateNodeById(data.nodes[0]);
      panelStore.openPanel('node', data.nodes[0]);
      // panelStore.loadNode(clickedNode);
    } else if (data.edges.length > 0) {
      // questionStore.updateEdgeById(data.edges[0]);
      // const clickedEdge = questionStore.getEdge(data.edges[0]);
      panelStore.openPanel('edge', data.edges[0]);
      // panelStore.loadEdge(clickedEdge);
    }
  }

  /**
   * Save the value from the json editor
   * @param {object} question json object of format
   * @param {string} question.question_name name of the question
   * @param {Object} question.query_graph consisting of nodes and edges
   * @param {Array} question.query_graph.nodes an array of nodes
   * @param {Array} question.query_graph.edges an array of edges
   * @param {Number} question.max_connectivity max connections for question
   */
  function saveJsonEditor(question) {
    try {
      questionStore.questionSpecToPanelState(question);
      toggleJsonEditor(!showJsonEditor);
      toggleGraph(true);
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
      // questionStore.setGraphState(graphStates.error);
    }
  }

  useEffect(() => {
    if (questionStore.query_graph) {
      panelStore.load(questionStore.query_graph);
      toggleGraph(true);
    }
  }, [questionStore.query_graph]);

  // const showFetching = questionStore.graphState === graphStates.fetching;
  // const notInitialized = questionStore.graphState === graphStates.empty;
  const numNodes = panelStore.query_graph.nodes.length;
  const numEdges = panelStore.query_graph.edges.length;
  // const error = questionStore.graphState === graphStates.error;

  return (
    <div id="QuestionGraphViewContainer">
      <ButtonGroupPanel panelStore={panelStore} toggleJsonEditor={() => toggleJsonEditor(!showJsonEditor)} />
      {showGraph ? (
        <QuestionGraphView
          height={height}
          width={width}
          question={panelStore.query_graph}
          concepts={config.concepts}
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
            {/* {showFetching && (
              <div>
                <FaSpinner className="icon-spin" style={{ marginRight: '10px', verticalAlign: 'text-top' }} />
                Graph update in progress... Please wait.
              </div>
            )} */}
            {/* {notInitialized && ( */}
            {numNodes === 0 && (
              <Button bsSize="large" onClick={() => panelStore.openPanel('node')}>
                <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' Add Node'}
              </Button>
            )}
            {/* {error && (
              <span>
                There was an error with the query graph specification
              </span>
            )} */}
          </div>
        </div>
      )}
      {((numNodes === 1 || numNodes === 2) && numEdges === 0) && (
        <div style={{ position: 'absolute', top: '47%', right: '20%' }}>
          <Button bsSize="large" onClick={() => panelStore.openPanel(numNodes === 1 ? 'node' : 'edge')}>
            <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{` Add ${numNodes === 1 ? 'Node' : 'Edge'}`}
          </Button>
        </div>
      )}
      <NewQuestionPanelModal
        panelStore={panelStore}
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
            questionStore={questionStore}
            callbackSave={saveJsonEditor}
            callbackCancel={() => toggleJsonEditor(!showJsonEditor)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}
