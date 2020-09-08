import { useState } from 'react';
import _ from 'lodash';

function getEmptyQueryGraph() {
  return {
    nodes: [], // { id, name?, type, curie? }
    edges: [], // { id, source_id, target_id, predicate? }
  };
}

export default function useQuestionStore() {
  // const [concepts, setConcepts] = useState([]);
  const [question_name, updateQuestionName] = useState('');
  const [query_graph, updateQueryGraph] = useState(null);
  const [max_connectivity, setMaxConnectivity] = useState(0);
  const [notes, updateNotes] = useState('');
  // const [graphState, updateGraphState] = useState(graphStates.empty);
  // const [graphState, updateGraphState] = useState('empty');
  // const [panelState, updatePanelState] = useState([]);
  // const [activePanelInd, setActivePanelInd] = useState(null);
  // const [activePanelState, updateActivePanelState] = useState({});
  // const [predicateList, setPredicateList] = useState({});
  // const [nodePropertyList, setNodePropertyList] = useState({});
  // const [showPanelModal, togglePanelModal] = useState(false);

  function resetQuestion() {
    updateQuestionName('');
    updateQueryGraph(null);
    setMaxConnectivity(0);
    updateNotes('');
    // updateGraphState('empty');
    // updatePanelState([]);
    // setActivePanelInd(null);
    // updateActivePanelState({});
  }

  /**
   * Returns a full question
   */
  function makeQuestion() {
    const newQueryGraph = getEmptyQueryGraph();
    const nodeIdMap = new Map(); // Mapping between internal integer ids to string ids for external consumption
    panelState.forEach((panel) => {
      if (isNode(panel)) {
        nodeIdMap.set(panel.id, `n${panel.id}`); // Convert integer id back to string for export
      }
    });
    panelState.forEach((panel) => {
      if (isNode(panel)) {
        const { deleted, curieEnabled, ...panelJson } = panel.toJsonObj();
        panelJson.id = nodeIdMap.get(panelJson.id);
        newQueryGraph.nodes.push(panelJson);
      }
      if (isEdge(panel)) {
        const { predicate, ...panelJson } = panel.toJsonObj();
        const typeObj = predicate ? { type: predicate } : {}; // Remap internal `predicate` field to `type` field
        panelJson.id = `e${panelJson.id}`; // Convert integer id back to string for export
        panelJson.source_id = nodeIdMap.get(panelJson.source_id);
        panelJson.target_id = nodeIdMap.get(panelJson.target_id);
        newQueryGraph.edges.push({ ...typeObj, panelJson });
      }
    });
    return { question_name, query_graph: newQueryGraph };
  }

  /**
   * Make sure a question is valid
   * @param {Object} question
   * @param {String} question.question_name name of question
   * @param {Object} question.query_graph contains nodes and edges
   * @param {Number} question.max_connectivity number of max edges on each node
   */
  function validateQuestion(question) {
    if (!('query_graph' in question) || question.query_graph === null) {
      return false;
    }
    if (!('nodes' in question.query_graph) || !('edges' in question.query_graph)) {
      return false;
    }
    if (!('question_name' in question) || question.question_name === '') {
      return false;
    }
    if (!('max_connectivity' in question)) {
      return false;
    }
    return true;
  }

  /**
   * Convert JSON workflow input format to internal Panel State representation.
   * panelState is set to an Array in internal Panel state representation of form:
   * [ InputPanel instance, OperationPanel instance, ... ]
   * Note: This method overwrites all supplied node/edge ids to internal integer representation
   * @param {Object} qGraph Object for new question
   * @param {String} qGraph.question_name name of the question
   * @param {Object} qGraph.query_graph object containing nodes and edges
   * @param {Array} qGraph.query_graph.edges array of edges
   * @param {Array} qGraph.query_graph.nodes array of nodes
   * @param {Number} qGraph.max_connectivity number of connections between nodes
   */
  function questionSpecToPanelState(qGraph) {
    try {
      resetQuestion();
      const questionGraphInput = _.cloneDeep(qGraph);
      const valid = validateQuestion(questionGraphInput);
      if (!valid) {
        throw Error('This question graph is invalid.');
      }
      updateQueryGraph(questionGraphInput.query_graph);
      updateQuestionName(questionGraphInput.question_name || '');
      setMaxConnectivity(typeof questionGraphInput.max_connectivity === 'number' ? questionGraphInput.max_connectivity : 'None');
    } catch (err) {
      resetQuestion();
      console.error('Failed to read this Question template', err);
      throw Error('Unable to load question.');
      // TODO: window alert
      // window.alert('Failed to read this Question template. Are you sure this is valid?');
    }
  }

  // function openQuestionPanel(type) {
  //   newQuestionPanel.create(type);
  //   togglePanelModal(true);
  // }

  // function savePanel(type, content) {
  //   if (type === 'node') {
  //     console.log('open a new node panel');
  //     nodePanels.createNew(content);
  //   } else {
  //     console.log('open a new edge panel');
  //     edgePanels.createNew(content);
  //   }
  // }

  function isValidQuestion() {
    return validateQuestion({
      question_name,
      query_graph,
      max_connectivity,
    });
  }

  return {
    question_name,
    query_graph,
    max_connectivity,
    isValidQuestion,
    // panelState,
    // activePanelState,
    // graphState,
    // showPanelModal,
    // newQuestionPanel,
    updateQuestionName,
    makeQuestion,
    questionSpecToPanelState,
    resetQuestion,
    // openQuestionPanel,
    // togglePanelModal,
    // savePanel,
  };
}
