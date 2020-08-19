import { useState, useEffect } from 'react';
import _ from 'lodash';

import useNodePanels from './useNodePanels';
import useEdgePanels from './useEdgePanels';

function getEmptyQueryGraph() {
  return {
    nodes: [], // { id, name?, type, curie? }
    edges: [], // { id, source_id, target_id, predicate? }
  };
}

export default function useQuestionStore() {
  const [concepts, setConcepts] = useState([]);
  const [question_name, updateQuestionName] = useState('');
  const [query_graph, updateQueryGraph] = useState(null);
  const [max_connectivity, setMaxConnectivity] = useState(0);
  const [notes, updateNotes] = useState('');
  // const [graphState, updateGraphState] = useState(graphStates.empty);
  const [graphState, updateGraphState] = useState('empty');
  const [panelState, updatePanelState] = useState([]);
  const [activePanelInd, setActivePanelInd] = useState(null);
  const [activePanelState, updateActivePanelState] = useState({});
  const [predicateList, setPredicateList] = useState({});
  const [nodePropertyList, setNodePropertyList] = useState({});
  const [showPanelModal, setPanelModal] = useState(false);
  const nodePanels = useNodePanels();
  const edgePanels = useEdgePanels();

  function resetQuestion() {
    updateQuestionName('');
    updateGraphState('empty');
    updatePanelState([]);
    setActivePanelInd(null);
    updateActivePanelState({});
  }

  /**
   * Returns the Query Graph
   */
  function makeQueryGraph() {
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
   * Convert JSON workflow input format to internal Panel State representation.
   * panelState is set to an Array in internal Panel state representation of form:
   * [ InputPanel instance, OperationPanel instance, ... ]
   * Note: This method overwrites all supplied node/edge ids to internal integer representation
   *
   * @param {JSON Object} query_graph - JSON Object satisfying spec
   *  of format {
   *    question_name: string,
   *    query_graph: {
   *      edges: [],
   *      nodes: [],
   *    },
   *    max_connectivity: 0,
   *  }
   */
  function queryGraphSpecToPanelState(qGraph) {
    try {
      resetQuestion();
      const questionGraphInput = _.cloneDeep(qGraph);
      updateQueryGraph(questionGraphInput.query_graph);
      updateQuestionName(questionGraphInput.questionName || '');
      setMaxConnectivity(typeof questionGraphInput.max_connectivity === 'number' ? questionGraphInput.max_connectivity : 'None');

      // Store mapping of original node/edge ids to internal representation and update panelState
      // with NodePanel and EdgePanel objects
      const nodeIdMap = new Map();
      const { nodes } = (questionGraphInput.query_graph.nodes && questionGraphInput.query_graph) || JSON.parse(questionGraphInput.query_graph.body);
      const { edges } = (questionGraphInput.query_graph.edges && questionGraphInput.query_graph) || JSON.parse(questionGraphInput.query_graph.body);
      nodes.forEach((node) => {
        const { id, ...nodeContents } = node;
        // TODO: reimplement unique ids
        nodePanels.createNew(nodeContents);
        // const uniqueId = nodePanels.getUniqueId();
        // const newNodePanel = new NodePanel(this, nodeContents);
        // nodeIdMap.set(id, uniqueId);
        // panelState.push(newNodePanel);
      });
      edges.forEach((edge, i) => {
        const edgeObj = { ...edge, id: i };
        if (edgeObj.type) { // Convert external `type` representation to internal `predicate` representation
          edgeObj.predicate = edgeObj.type;
          delete edgeObj.type;
        }
        if (edgeObj.predicate && ((edgeObj.predicate instanceof String) || (typeof edgeObj.predicate === 'string'))) {
          edgeObj.predicate = [edgeObj.predicate];
        }
        // Change references to node ids to internal nodeid representation
        // edgeObj.source_id = nodeIdMap.get(edgeObj.source_id);
        // edgeObj.target_id = nodeIdMap.get(edgeObj.target_id);
        edgePanels.createNew(edgeObj);
        // panelState.push(new EdgePanel(this, edgeObj));
      });

      // Reset activePanel to 1st panel/node
      updateActivePanelState({});
      setActivePanelInd(null);
      if (nodePanels.nodes.length > 0) {
        updateGraphState('display');
      } else {
        updateGraphState('empty');
      }
    } catch (err) {
      resetQuestion();
      updateGraphState('error');
      console.error('Failed to read this Question template', err);
      // TODO: window alert
      // window.alert('Failed to read this Question template. Are you sure this is valid?');
    }
  }

  // Checks if Graph UI is fully valid and returns object
  // of form { isValid: bool, isValidGraph: bool, errorList: Array of strings }
  function graphValidationState() {
    let isValid = true;
    const errorList = [];
    // need to make sure there's at least one valid node
    // if (!nodePanels.length || !nodePanels.reduce((prev, panel) => prev && panel.isValid, true)) {
    //   isValidGraph = false;
    //   errorList.push('One or more invalid nodes');
    // }
    // if (!edgePanels().reduce((prev, panel) => prev && panel.isValid, true)) {
    //   isValidGraph = false;
    //   errorList.push('One or more invalid edges');
    // }
    if (question_name.length === 0) {
      isValid = false;
      errorList.push('Please enter a valid question name');
    }
    return { isValid, isValidGraph: true, errorList };
  }

  function newQuestionPanel(type) {
    if (type === 'node') {
      console.log('open a new node panel');
    } else {
      console.log('open a new edge panel');
    }
  }

  return {
    question_name,
    query_graph,
    max_connectivity,
    panelState,
    activePanelState,
    graphState,
    updateQuestionName,
    makeQueryGraph,
    graphValidationState,
    queryGraphSpecToPanelState,
    newQuestionPanel,
  };
}
