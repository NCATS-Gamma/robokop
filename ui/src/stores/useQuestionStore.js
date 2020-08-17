import { useState, useEffect } from 'react';
import _ from 'lodash';

export default function useQuestionStore() {
  const [concepts, setConcepts] = useState([]);
  const [questionName, updateQuestionName] = useState('');
  const [notes, updateNotes] = useState('');
  // const [graphState, updateGraphState] = useState(graphStates.empty);
  const [graphState, updateGraphState] = useState('empty');
  const [maxConnectivity, setMaxConnectivity] = useState(0);
  const [panelState, updatePanelState] = useState([]);
  const [activePanelInd, setActivePanelInd] = useState(null);
  const [activePanelState, updateActivePanelState] = useState({});
  const [predicateList, setPredicateList] = useState({});
  const [nodePropertyList, setNodePropertyList] = useState({});
  const [showPanelModal, setPanelModal] = useState(false);

  /**
   * Deletes any NodePanel instances in store.panelState that are not referenced by any edges.
   * This also flags any edges linked to a node flagged for deletion as broken=true
   * Also remaps activePanelInd since the panelInds change due to deletion of nodePanels so
   * that the activePanelState still corresponds to the correct panelState entry
   */
  function deleteUnlinkedNodes() {
    // console.log('Running action - deleteUnlinkedNodes');
    let linkedNodeIds = [];
    panelState.forEach((panel) => {
      if (panel.panelType === panelTypes.edge) {
        linkedNodeIds.push(panel.source_id);
        linkedNodeIds.push(panel.target_id);
      }
    });
    linkedNodeIds = _.uniq(linkedNodeIds);
    // Loop through each node panel and check if deleted ones are referenced in linkedNodeIds
    let panelIndsToDelete = [];
    panelState.forEach((panel, i) => {
      if ((panel.panelType === panelTypes.node) && (panel.deleted)) {
        if (linkedNodeIds.indexOf(panel.id) === -1) {
          panelIndsToDelete.push(i);
        }
      }
    });
    panelIndsToDelete = panelIndsToDelete.sort((a, b) => b - a); // Highest inds first so we can delete in this order

    let resetActivePanelAfterDeletion = false;
    if (activePanelInd !== panelState.length) {
      if (panelIndsToDelete.indexOf(activePanelInd) !== -1) {
        resetActivePanelAfterDeletion = true; // Active panel corresponds to a node being deleted (should never happen)
      }
    }
    // Delete the nodes cleared for deletion
    panelIndsToDelete.forEach(indToDelete => panelState.splice(indToDelete, 1));
    // Reset the activePanelState and ind if necessary
    if (resetActivePanelAfterDeletion) {
      syncActivePanelToClosestNonDeletedPanelInd();
    }
    // Since panels may have been deleted, need to remap old activePanelInd to new one
    if (!_.isEmpty(activePanelState)) {
      const activePanelInfo = { type: activePanelState.panelType, id: activePanelState.id };
      panelState.forEach((panel, i) => {
        if ((panel.panelType === activePanelInfo.type) && (panel.id === activePanelInfo.id)) {
          activePanelInd = i;
        }
      });
    }
  }

  // Get list of panels of specific type from panelState
  function getPanelsByType(panelType) {
    const panels = [];
    panelState.forEach((panel) => {
      if (panel.panelType === panelType) {
        panels.push(panel);
      }
    });
    return panels;
  }

  function nodePanels() {
    return getPanelsByType('node');
  }

  function getNodePanelById(id) {
    return nodePanels.find(panel => panel.id === id);
  }

  function edgePanels() {
    return getPanelsByType('edge');
  }

  // Return list of ids for nodes that are not flagged with deleted = true
  function visibleNodePanels() {
    return nodePanels.filter(panel => !panel.deleted);
  }

  // panelType is from panelTypes ENUM
  function getIdListByType(panelType) {
    return getPanelsByType(panelType).map(panel => panel.id);
  }

  // Returns a list of all the node ids in panelState
  // This includes any "hidden" nodes with deleted = true
  function nodeIdList() {
    return getIdListByType(panelTypes.node);
  }

  // Return list of ids for nodes that are not flagged with deleted = true
  function visibleNodeIdList() {
    return nodePanels.filter(panel => !panel.deleted).map(panel => panel.id);
  }

  // Closest ind (for panelState) corresponding to all EdgePanels and
  // any NodePanel that has not been flagged for deletion. Returns -1 if no valid panels exist
  function closestNonDeletedPanelInd(ind) {
    const panelInds = [];
    panelState.forEach((panel, i) => {
      if ((panel.panelType === panelTypes.edge) || (!panel.deleted)) {
        panelInds.push(i);
      }
    });
    if (panelInds.length === 0) {
      return -1;
    }
    const closestInd = panelInds.reduce((prev, curr) => (Math.abs(curr - ind) < Math.abs(prev - ind) ? curr : prev));
    return closestInd;
  }

  // Returns a list of all the edge ids in panelState
  function edgeIdList() {
    return getIdListByType(panelTypes.edge);
  }

  // Returns if specific node id is valid (exists in panelState)
  function isValidNode(id) {
    if (id === null) {
      return false;
    }
    const nodeIds = nodeIdList();
    return nodeIds.indexOf(id) !== -1;
  }

  // Returns null if no active element or editing a new panel
  // Returns {type: 'node', id: 0} or {type: 'edge', id: 0}
  function activePanelToGraphElement() {
    if ((!isActivePanel) || (activePanelInd === panelState.length)) {
      return null;
    }
    return { type: activePanelState.panelType, id: activePanelState.id };
  }

  // Determine if activePanelState is different from the corresponding
  // saved panel state
  function isUnsavedChanges() {
    if (!isActivePanel) {
      return false; // Nothing to save if no active panel
    }
    if (activePanelInd === panelState.length) {
      return true; // This is an unsaved panel
    }
    if (panelState[activePanelInd]) {
      return !panelState[activePanelInd].isEqual(activePanelState); // Uses Panel isEqual class method
    }
    return false;
  }

  // Is a panel (input or output currently selected / being edited)
  function isActivePanel() {
    return !_.isEmpty(activePanelState);
  }

  function syncActivePanelToPanelInd() {
    if (panelState.length === 0) {
      activePanelState = {};
      activePanelInd = 0;
      return;
    }
    if (activePanelInd >= panelState.length) {
      activePanelInd = panelState.length - 1;
    }
    activePanelState = panelState[activePanelInd].clone();
  }

  // graphState should be a value from graphStates Enum
  function setGraphState(graphState) {
    graphState = graphState;
  }

  // Compute machineQuestion representation of graph from internal PanelState
  // Binds isSelected = true to the node/edge that is currently active
  // Used by by vis-js graphing primarily
  function machineQuestion() {
    if (panelState.length === 0) {
      return null;
    }
    const machineQuestion = getEmptyMachineQuestion();
    const graphElementBlob = activePanelToGraphElement();
    panelState.forEach((panel) => {
      if (isNode(panel)) {
        const panelAsJson = panel.toJsonObj();
        if ((graphElementBlob !== null) && (graphElementBlob.type === panelTypes.node) && (graphElementBlob.id === panel.id)) {
          panelAsJson.isSelected = true; // Set isSelected = true for selected node/edge
        }
        panelAsJson.label = panel.panelName;
        machineQuestion.nodes.push(panelAsJson);
      }
      if (isEdge(panel)) {
        const panelAsJson = panel.toJsonObj();
        if ((graphElementBlob !== null) && (graphElementBlob.type === panelTypes.edge) && (graphElementBlob.id === panel.id)) {
          panelAsJson.isSelected = true; // Set isSelected = true for selected node/edge
        }
        machineQuestion.edges.push(panelAsJson);
      }
    });
    return machineQuestion;
  }

  /**
   * Returns the Question in MachineQuestion JSON Spec
   */
  function getMachineQuestionSpecJson() {
    const machineQuestion = getEmptyMachineQuestion();
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
        machineQuestion.nodes.push(panelJson);
      }
      if (isEdge(panel)) {
        const { predicate, ...panelJson } = panel.toJsonObj();
        const typeObj = predicate ? { type: predicate } : {}; // Remap internal `predicate` field to `type` field
        panelJson.id = `e${panelJson.id}`; // Convert integer id back to string for export
        panelJson.source_id = nodeIdMap.get(panelJson.source_id);
        panelJson.target_id = nodeIdMap.get(panelJson.target_id);
        machineQuestion.edges.push({ ...typeObj, panelJson });
      }
    });
    return { natural_question: questionName, machine_question: machineQuestion };
  }

  /**
   * Convert JSON workflow input format to internal Panel State representation.
   * panelState is set to an Array in internal Panel state representation of form:
   * [ InputPanel instance, OperationPanel instance, ... ]
   * Note: This method overwrites all supplied node/edge ids to internal integer representation
   *
   * @param {JSON Object} machineQuestionInp - JSON Object satisfying MachineQuestion spec
   *  of format { natural_question: string, machine_question: { edges: [], nodes: [] }}
   */
  function machineQuestionSpecToPanelState(machineQuestionInp) {
    try {
      resetQuestion();
      const machineQuestionInput = _.cloneDeep(machineQuestionInp);
      questionName = machineQuestionInput.natural_question || '';
      maxConnectivity = typeof machineQuestionInput.maxConnectivity === 'number' ? machineQuestionInput.maxConnectivity : 'None';

      // Store mapping of original node/edge ids to internal representation and update panelState
      // with NodePanel and EdgePanel objects
      const nodeIdMap = new Map();
      const { nodes } = (machineQuestionInput.machine_question.nodes && machineQuestionInput.machine_question) || JSON.parse(machineQuestionInput.machine_question.body);
      const { edges } = (machineQuestionInput.machine_question.edges && machineQuestionInput.machine_question) || JSON.parse(machineQuestionInput.machine_question.body);
      nodes.forEach((node) => {
        const { id, ...nodeContents } = node;
        const newNodePanel = new NodePanel(this, nodeContents);
        nodeIdMap.set(id, newNodePanel.id);
        panelState.push(newNodePanel);
      });
      edges.forEach((edge, i) => {
        const edgeObj = Object.assign({}, edge, { id: i });
        if (edgeObj.type) { // Convert external `type` representation to internal `predicate` representation
          edgeObj.predicate = edgeObj.type;
          delete edgeObj.type;
        }
        if (edgeObj.predicate && ((edgeObj.predicate instanceof String) || (typeof edgeObj.predicate === 'string'))) {
          edgeObj.predicate = [edgeObj.predicate];
        }
        // Change references to node ids to internal nodeid representation
        edgeObj.source_id = nodeIdMap.get(edgeObj.source_id);
        edgeObj.target_id = nodeIdMap.get(edgeObj.target_id);
        panelState.push(new EdgePanel(this, edgeObj));
      });

      // Reset activePanel to 1st panel/node
      activePanelState = {};
      activePanelInd = null;
      if (panelState.length > 0) {
        setGraphState(graphStates.display);
      } else {
        setGraphState(graphStates.empty);
      }
    } catch (err) {
      resetQuestion();
      setGraphState(graphStates.error);
      console.error('Failed to read this Question template', err);
      window.alert('Failed to read this Question template. Are you sure this is valid?');
    }
  }

  // Checks if Graph UI is fully valid and returns object
  // of form { isValid: bool, isValidGraph: bool, errorList: Array of strings }
  function graphValidationState() {
    let isValid = true;
    let isValidGraph = true;
    const errorList = [];
    // need to make sure there's at least one valid node
    if (!nodePanels.length || !nodePanels.reduce((prev, panel) => prev && panel.isValid, true)) {
      isValidGraph = false;
      errorList.push('One or more invalid nodes');
    }
    if (!edgePanels().reduce((prev, panel) => prev && panel.isValid, true)) {
      isValidGraph = false;
      errorList.push('One or more invalid edges');
    }
    if (questionName.length === 0) {
      isValid = false;
      errorList.push('Please enter a valid question name');
    }
    return { isValid: isValid && isValidGraph, isValidGraph, errorList };
  }

  // Checks only if graph part of the question is valid
  function isValidGraph() {
    return panelState.reduce((prev, panel) => prev && panel.isValid);
  }

  function getEmptyMachineQuestion() {
    return {
      nodes: [], // { id, name?, type, curie? }
      edges: [], // { id, source_id, target_id, predicate? }
    };
  }

  function isNode(panel) {
    return panel.panelType === panelTypes.node;
  }

  function isEdge(panel) {
    return panel.panelType === panelTypes.edge;
  }

  function resetQuestion() {
    questionName = '';
    graphState = graphStates.empty;
    panelState = [];
    activePanelInd = null;
    activePanelState = {};
  }

  function newActivePanel(panelType) {
    togglePanelModal();
    if (panelType === panelTypes.node) {
      activePanelState = new NodePanel(this);
    }
    if (panelType === panelTypes.edge) {
      // If a node was previously selected when clicking "New Edge", the source-id
      // for the new edge is pre-populated with a reference to the initially selected node
      // if (activePanelInd && (panelState.length > activePanelInd) && isNode(panelState[activePanelInd])) {
      //   activePanelState = new EdgePanel(this, { source_id: panelState[activePanelInd].id });
      // } else {
      //   activePanelState = new EdgePanel(this);
      // }
      activePanelState = new EdgePanel(this);
    }
    activePanelInd = panelState.length;
  }

  // Revert any unsaved changes in a panel for an existing node
  function revertActivePanel() {
    activePanelState = panelState[activePanelInd].clone();
  }

  function deleteActivePanel() {
    // Handle if deleting an existing node in graph
    if (activePanelInd < panelState.length) {
      // Remove if edge panel
      if (activePanelState.panelType === panelTypes.edge) {
        panelState.splice(activePanelInd, 1); // Delete the edgePanel
      } else {
        // Flag nodePanel as 'deleted'
        panelState[activePanelInd].deleted = true;
        // Flag any broken edges with a `broken` field for graph display
        const deletedNodeId = panelState[activePanelInd].id;
        edgePanels().forEach((edgePanel) => {
          if ((edgePanel.source_id === deletedNodeId) || (edgePanel.target_id === deletedNodeId)) {
            edgePanel.broken = true; // eslint-disable-line no-param-reassign
          }
        });
      }
    }
    // Update activePanelInd and activePanelState accordingly
    syncActivePanelToClosestNonDeletedPanelInd();
    togglePanelModal();
  }

  // Sets activePanelInd to closest ind that is not deleted or an edge. Also
  // updates activePanelState accordingly.
  function syncActivePanelToClosestNonDeletedPanelInd() {
    // Update activePanelInd and activePanelState accordingly
    const activePanelInd = closestNonDeletedPanelInd(activePanelInd);
    if (activePanelInd === -1) {
      activePanelInd = panelState.length;
      activePanelState = {};
    } else {
      activePanelInd = activePanelInd;
      activePanelState = panelState[activePanelInd].clone();
    }
  }

  function saveActivePanel() {
    // if curies aren't enabled, delete all curies
    if (activePanelState.panelType === 'node' && !activePanelState.curieEnabled) {
      activePanelState.curie = [];
      activePanelState.name = '';
    }
    panelState[activePanelInd] = activePanelState.clone();
    togglePanelModal();
    if (isEdge(panelState[activePanelInd])) {
      // Saving an edge means it has to be valid, so `broken` param must be false
      panelState[activePanelInd].broken = false;
    }
    graphState = graphStates.display;
  }

  function updateActivePanelFromNodeId(id) {
    let nodePanelInd = null;
    panelState.forEach((p, i) => {
      if ((p.panelType === panelTypes.node) && (p.id === id) && (!p.deleted)) {
        nodePanelInd = i;
      }
    });
    if (nodePanelInd !== null) { // TODO: Consider updating only if activePanelInd differs from nodePanelInd
      activePanelInd = nodePanelInd;
      activePanelState = panelState[nodePanelInd].clone();
      togglePanelModal();
    }
  }

  function updateActivePanelFromEdgeId(id) {
    let edgePanelInd = null;
    panelState.forEach((p, i) => {
      if ((p.panelType === panelTypes.edge) && (p.id === id)) {
        edgePanelInd = i;
      }
    });
    if (edgePanelInd !== null) {
      activePanelInd = edgePanelInd;
      activePanelState = panelState[edgePanelInd].clone();
      togglePanelModal();
    }
  }

  function togglePanelModal() {
    if (isUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to close? You will lose your work.')) {
        return;
      }
      activePanelState = {};
    }
    const showModal = showPanelModal;
    showPanelModal = !showModal;
  }

  // Async action to update concepts list and conceptsReady flag in store
  function updateConcepts() { // eslint-disable-line func-names
    try {
      const concepts = (() => new Promise((resolve, reject) => {
        appConfig.concepts(c => resolve(c), err => reject(err));
      }))();
      // console.log('Concepts returned:', concepts);
      concepts = concepts;
      conceptsReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX store concepts entry', e);
    }
  }

  // Async action to update user and userReady flag in store
  function updateUser() { // eslint-disable-line func-names
    try {
      // const concepts = yield appConfig.concepts(c => Promise.resolve(c));
      const user = (() => new Promise((resolve, reject) => {
        appConfig.user(u => resolve(u), err => reject(err));
      }))();
      user = user;
      userReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX user entry', e);
    }
  }

  // Async action to update predicates list and predicatesReady flag in store
  function updatePredicates() { // eslint-disable-line func-names
    try {
      const predicates = (() => new Promise((resolve, reject) => {
        appConfig.predicates(c => resolve(c), err => reject(err));
      }))();
      predicateList = predicates;
      predicatesReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX store predicates entry', e);
    }
  }

  // Async action to update nodeProperties list and nodePropertiesReady flag in store
  function updateNodeProperties() { // eslint-disable-line func-names
    try {
      const nodeProperties = (() => new Promise((resolve, reject) => {
        appConfig.nodeProperties(c => resolve(c), err => reject(err));
      }))();
      nodePropertyList = nodeProperties;
      nodePropertiesReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX store node properties entry', e);
    }
  }

  // Async action to submit natural language question to NLP parser and
  // obtain the corresponding machine-question from the NLP engine
  function nlpParseQuestion() { // eslint-disable-line func-names
    try {
      const question = questionName;
      nlpFetching = true;
      const machineQuestion = (() => new Promise((resolve, reject) => {
        appConfig.questionNewTranslate(question, mq => resolve(mq), err => reject(err));
      }))();
      machineQuestionSpecToPanelState({ natural_question: question, machine_question: machineQuestion });
      nlpFetching = false;
    } catch (e) {
      resetQuestion();
      setGraphState(graphStates.error);
      nlpFetching = false;
      console.error('Failed to retrieve and update MobX store with NLP parser outputs', e);
    }
  }

  // Set store state based on question data from provided question-id
  // If id is '', then dataReady set to True since no template provided
  function getQuestionData(id) { // eslint-disable-line func-names
    if (id === '') {
      dataReady = true;
      return;
    }
    try {
      // const concepts = yield appConfig.concepts(c => Promise.resolve(c));
      const data = (() => new Promise((resolve, reject) => {
        appConfig.questionData(id, u => resolve(u), err => reject(err));
      }))();
      machineQuestionSpecToPanelState({
        natural_question: data.data.question.natural_question,
        machine_question: data.data.question.machine_question,
        maxConnectivity: maxConnectivity,
      });
      dataReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX store with question template data', e);
    }
  }

  // Dispose all reactions so they are garbage collected when store is
  // destroyed (invoke in componentWillUnmount of root React component)
  function cleanup() {
    disposeDeleteUnlinkedNodes();
    disposeGraphStateEmpty();
  }

  useEffect(() => {
    // getConcepts();
    // getUser();
    // getPredicates();
    // getNodeProperties();
  }, []);
  return {
    questionName,
    updateQuestionName,
    panelState,
    maxConnectivity,
    getMachineQuestionSpecJson,
    activePanelState,
    graphValidationState,
  };
}
