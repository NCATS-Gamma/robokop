import { observable, action, computed, flow, toJS, configure, autorun, reaction, runInAction } from 'mobx';

import { graphStates } from '../components/shared/MachineQuestionViewContainer';
import entityNameDisplay from '../components/util/entityNameDisplay';
import AppConfig from '../AppConfig';

import { config } from '../index';

const _ = require('lodash');

configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions
/* eslint-disable no-underscore-dangle, camelcase */
// ENUM for panel type
const panelTypes = {
  edge: 'edge',
  node: 'node',
};

class EdgePanel {
  @observable id = null; // Used to id the edge in vis-js
  @observable source_id = null;
  @observable target_id = null;
  @observable predicate = [];

  @observable broken = false; // If source_id or target_id refer to a deleted node

  @observable awaitingPredicateList = false; // True when requesting end-point for predicates for source/target pairing
  @observable predicateList = [];

  panelType = panelTypes.edge;

  _publicFields = ['id', 'source_id', 'target_id', 'predicate'];

  constructor(store, userObj = {}) {
    this.store = store;
    runInAction(() => {
      this.id = this.getUniqueId();
      // Assign any supplied params to this instance
      this._publicFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(userObj, field)) {
          this[field] = userObj[field];
        }
      });
    });
  }

  // Returns lowest non-zero integer id not already used
  getUniqueId() {
    const candidateIds = _.range(this.store.panelState.length + 1);
    const currentIds = this.store.edgeIdList();
    return _.difference(candidateIds, currentIds).sort()[0];
  }

  @action.bound updateField(field, value) { // eslint-disable-line consistent-return
    if (this._publicFields.indexOf(field) > -1) {
      this[field] = value;
    } else {
      console.error(`Invalid field - ${field} supplied to EdgePanel.updateField action`);
    }
  }

  // If user creates a predicate, it is provided as a string and should be appended
  @action.bound updatePredicate(name) {
    this.predicate.push(name);
  }

  @computed get sourceNode() {
    const sourceNode = this.store.nodePanels.filter(panel => panel.id === this.source_id);
    if (sourceNode.length > 0) {
      return sourceNode[0];
    }
    return null;
  }

  @computed get targetNode() {
    const targetNode = this.store.nodePanels.filter(panel => panel.id === this.target_id);
    if (targetNode.length > 0) {
      return targetNode[0];
    }
    return null;
  }

  @computed get isValidSource() {
    return this.store.isValidNode(this.source_id) && !this.sourceNode.deleted;
  }

  @computed get isValidTarget() {
    return this.store.isValidNode(this.target_id) && !this.targetNode.deleted;
  }

  @computed get isValidPredicate() {
    return true; // TODO: Replace with code below when predicate endpoint is implemented
    // return !this.store.awaitingPredicateList &&
    //   !this.store.predicateFetchError &&
    //   (_.difference(this.predicate, this.store.predicateList).length === 0);
  }

  @computed get isValid() {
    return this.isValidSource && this.isValidTarget && !this.broken && this.isValidPredicate;
  }

  // Prettified label for the panel
  @computed get panelName() {
    let sourceLabel = '';
    let targetLabel = '';
    if (this.source_id !== null) {
      sourceLabel = this.store.getPanelsByType(panelTypes.node)
        .filter(panel => panel.id === this.source_id)[0].panelName;
    }
    if (this.target_id !== null) {
      targetLabel = this.store.getPanelsByType(panelTypes.node)
        .filter(panel => panel.id === this.target_id)[0].panelName;
    }
    let predicateLabel = this.predicate.join(', ');
    predicateLabel = predicateLabel ? `—[${predicateLabel}]` : '';
    return `${sourceLabel} ${predicateLabel}→ ${targetLabel}`;
  }

  /**
   * Determines if contents of this instance matches another
   * @param {Object} other - Other Panel like object
   */
  isEqual(other) {
    if (!(other instanceof EdgePanel)) {
      return false;
    }
    return _.isEqual(this.toJsonObj(), other.toJsonObj());
  }

  // Make a deep clone of this instance
  clone() {
    const userObj = {};
    this._publicFields.forEach(field => (userObj[field] = toJS(this[field]))); // eslint-disable-line no-underscore-dangle
    return new EdgePanel(this.store, userObj);
  }

  toJsonObj() {
    const jsonObj = {
      id: toJS(this.id),
      source_id: toJS(this.source_id),
      target_id: toJS(this.target_id),
    };
    if (this.predicate.length > 0) {
      jsonObj.predicate = toJS(this.predicate);
    }
    return jsonObj;
  }
}

class NodePanel {
  @observable id = null;
  @observable type = '';
  @observable name = '';
  @observable curie = [];
  @observable curieEnabled = false;
  @observable set = false;
  @observable deleted = false;
  panelType = panelTypes.node;

  _publicFields = ['id', 'name', 'type', 'curie', 'set'];

  constructor(store, userObj = {}) {
    this.store = store;
    runInAction(() => {
      this.id = this.getUniqueId();
      // Assign any supplied params to this instance
      this._publicFields.forEach((field) => { // eslint-disable-line no-underscore-dangle
        if (Object.prototype.hasOwnProperty.call(userObj, field)) {
          this[field] = userObj[field];
        }
      });
      // Ensure curie is always an array of strings
      if ((typeof this.curie === 'string') || (this.curie instanceof String)) {
        this.curie = [this.curie];
      }
      if (this.curie.length !== 0) {
        this.curieEnabled = true;
      }
    });
  }

  @action.bound toggleCurieEnable() {
    if (this.curieEnabled) {
      this.curieEnabled = false;
      this.curie = [];
    } else {
      this.curieEnabled = true;
    }
  }

  // Returns lowest non-zero integer id not already used
  getUniqueId() {
    const candidateIds = _.range(this.store.panelState.length + 1);
    const currentIds = this.store.nodeIdList();
    return _.difference(candidateIds, currentIds).sort((a, b) => a - b)[0];
  }

  @action.bound updateField(field, value) { // eslint-disable-line consistent-return
    if (this._publicFields.indexOf(field) > -1) {
      // Reset the curieList for Node if a new type is selected
      if (field === 'type') {
        if (this.type !== value) {
          this.resetCurie();
        }
      }
      if (field === 'curie') {
        // Ensure that only valid curies are written into the data structure
        let curieVal = value;
        if ((typeof curieVal === 'string') || (curieVal instanceof String)) {
          curieVal = [curieVal];
        }
        this[field] = curieVal;
      } else {
        this[field] = value;
      }
    } else {
      console.error(`Invalid field - ${field} supplied to NodePanel.updateField action`);
    }
  }

  @action.bound addCurie() {
    this.curie.push('');
  }

  @action.bound deleteCurie(i) {
    this.curie.splice(i, 1);
  }

  @action.bound updateCurie(i, type, label, curie) {
    this.curie[i] = curie;
  }

  @action.bound resetCurie() {
    this.curie = [];
  }

  @computed get isValidType() {
    return this.store.concepts.indexOf(this.type) > -1;
  }

  isValidCurie(val) {
    return /^[a-z0-9_\+\-]+:[a-z0-9_\+\-]+/i.test(val); // eslint-disable-line no-useless-escape
  }

  @computed get isValidCurieList() {
    if (!this.curieEnabled) {
      return true; // If curie not enabled, this should return true
    }
    let curieList = toJS(this.curie);
    if (_.isPlainObject(curieList)) {
      curieList = [curieList];
    }
    const isValid = curieList.reduce((isVal, curie) => isVal && this.isValidCurie(curie), true);
    return isValid;
  }

  @computed get isValid() {
    return this.isValidType && this.isValidCurieList && !this.deleted;
  }

  // Prettified label for the panel
  @computed get panelName() {
    return `${this.id}: ${this.name === '' ? entityNameDisplay(this.type) : this.name}${this.curieEnabled ? '*' : ''}`;
  }

  /**
   * Determines if contents of this instance matches another
   * @param {Object} other - Other Panel like object
   */
  isEqual(other) {
    if (!(other instanceof NodePanel)) {
      return false;
    }
    return _.isEqual(this.toJsonObj(), other.toJsonObj());
  }

  // Make a deep clone of this instance
  clone() {
    const userObj = {};
    this._publicFields.forEach(field => (userObj[field] = toJS(this[field])));
    return new NodePanel(this.store, userObj);
  }

  // Convert to JSON object representation. Only return "non-empty" field
  toJsonObj() {
    const jsonObj = {
      id: toJS(this.id),
      type: toJS(this.type),
      set: toJS(this.set),
      curieEnabled: toJS(this.curieEnabled),
      deleted: toJS(this.deleted),
    };
    if (this.name !== '') {
      jsonObj.name = toJS(this.name);
    }
    if (this.curie.length > 0) {
      jsonObj.curie = toJS(this.curie);
    }
    return jsonObj;
  }
}


class NewQuestionStore {
  @observable concepts = [];
  @observable conceptsReady = false;

  @observable user = {};
  @observable userReady = false;
  @observable dataReady = false;

  @observable questionName = '';
  @observable notes = '';
  @observable graphState = graphStates.empty;

  @observable panelState = [];
  @observable activePanelInd = 0;
  @observable activePanelState = {};

  @observable predicateList = [];
  @observable awaitingPredicateList = false;
  @observable predicateFetchError = null;
  predicateCache = new Map();
  predicateFetchPromise = null;

  @observable nlpFetching = false;

  constructor() {
    this.appConfig = new AppConfig(config);
    this.updateConcepts();
    this.updateUser();

    // Reaction to auto remove any nodes flagged for deletion if no edges link to it
    this.disposeDeleteUnlinkedNodes = reaction(
      () => this.panelState.map((panel) => {
        if (this.isNode(panel)) {
          return panel.deleted ? 'deleted' : 'valid';
        }
        return `${panel.source_id}-${panel.target_id}`;
      }),
      () => this.deleteUnlinkedNodes(),
      { compareStructural: true },
    );

    // Ensure graphState is set to 'empty' any time panelState is empty
    this.disposeGraphStateEmpty = reaction(
      () => this.panelState.length === 0,
      (isGraphEmpty) => {
        console.log('Running reaction - Check Empty Graph');
        if (isGraphEmpty) {
          this.setGraphState(graphStates.empty);
        }
      },
    );

    // Fetch and store list of predicates that are available for the source-target
    // type pairing any time the pairing changes.
    this.disposeAutoFetchPredicateList = reaction(
      () => ({
        source: {
          type: this.activePanelState.sourceNode ? this.activePanelState.sourceNode.type : '',
          deleted: this.activePanelState.sourceNode ? this.activePanelState.sourceNode.deleted : false,
        },
        target: {
          type: this.activePanelState.targetNode ? this.activePanelState.targetNode.type : '',
          deleted: this.activePanelState.targetNode ? this.activePanelState.targetNode.deleted : false,
        },
      }),
      async (nodeInfo) => {
        // Cancel old request if it is still pending
        if (this.predicateFetchPromise) {
          await this.predicateFetchPromise.cancel();
        }
        // Make a new async request to get predicate list
        this.predicateFetchPromise = this.getPredicateListFAKE(nodeInfo);
        this.predicateFetchPromise.catch((err) => { // Need this since this promise is rejected with FLOW_CANCELLED error
          if (err.message === 'FLOW_CANCELLED') {
            console.log('Successfully cancelled stale predicateFetchPromise');
          } else {
            console.error('Error in predicateFetchPromise', err);
            runInAction(() => {
              this.predicateList = [];
              this.awaitingPredicateList = false;
              this.predicateFetchError = 'Error retrieving predicate options!';
            });
          }
        });
      },
      { compareStructural: true },
    );

    // Demo code to seed UI with an initial graph
    // runInAction(() => {
    //   this.panelState = [
    //     new NodePanel(this, { id: 0, name: 'imatinib', type: 'chemical_substance', curie: 'CHEMBL:CHEMBL1421' }),
    //     new NodePanel(this, { id: 1, type: 'gene' }),
    //     new NodePanel(this, { id: 2, type: 'biological_process', set: true }),
    //     new NodePanel(this, { id: 3, name: 'asthma', type: 'disease', curie: 'CHEMBL:CHEMBL714' }),
    //     new EdgePanel(this, { id: 0, source_id: 0, target_id: 1 }),
    //     new EdgePanel(this, { id: 1, source_id: 1, target_id: 2 }),
    //     new EdgePanel(this, { id: 2, source_id: 2, target_id: 3 }),
    //   ];
    //   this.graphState = graphStates.display;
    //   this.syncActivePanelToPanelInd();
    // });
  }

  /**
   * Deletes any NodePanel instances in store.panelState that are not referenced by any edges.
   * This also flags any edges linked to a node flagged for deletion as broken=true
   * Also remaps activePanelInd since the panelInds change due to deletion of nodePanels so
   * that the activePanelState still corresponds to the correct panelState entry
   */
  @action deleteUnlinkedNodes() {
    // console.log('Running action - deleteUnlinkedNodes');
    let linkedNodeIds = [];
    this.panelState.forEach((panel) => {
      if (panel.panelType === panelTypes.edge) {
        linkedNodeIds.push(panel.source_id);
        linkedNodeIds.push(panel.target_id);
      }
    });
    linkedNodeIds = _.uniq(linkedNodeIds);
    // Loop through each node panel and check if deleted ones are referenced in linkedNodeIds
    let panelIndsToDelete = [];
    this.panelState.forEach((panel, i) => {
      if ((panel.panelType === panelTypes.node) && (panel.deleted)) {
        if (linkedNodeIds.indexOf(panel.id) === -1) {
          panelIndsToDelete.push(i);
        }
      }
    });
    panelIndsToDelete = panelIndsToDelete.sort((a, b) => b - a); // Highest inds first so we can delete in this order

    let resetActivePanelAfterDeletion = false;
    if (this.activePanelInd !== this.panelState.length) {
      if (panelIndsToDelete.indexOf(this.activePanelInd) !== -1) {
        resetActivePanelAfterDeletion = true; // Active panel corresponds to a node being deleted (should never happen)
      }
    }
    // Delete the nodes cleared for deletion
    panelIndsToDelete.forEach(indToDelete => this.panelState.splice(indToDelete, 1));
    // Reset the activePanelState and ind if necessary
    if (resetActivePanelAfterDeletion) {
      this.syncActivePanelToClosestNonDeletedPanelInd();
    }
    // Since panels may have been deleted, need to remap old activePanelInd to new one
    if (!_.isEmpty(this.activePanelState)) {
      const activePanelInfo = { type: this.activePanelState.panelType, id: this.activePanelState.id };
      this.panelState.forEach((panel, i) => {
        if ((panel.panelType === activePanelInfo.type) && (panel.id === activePanelInfo.id)) {
          this.activePanelInd = i;
        }
      });
    }
  }

  // Async action to mimic request to determine list of predicates
  // that can be selected for the source-target type pairing
  // Predicate lists are memoized and stored in predicateCache
  getPredicateListFAKE = flow(function* getPredicateList(nodeInfo) {
    console.log('in getPredicateListFake reaction', nodeInfo.source.type, nodeInfo.target.type);
    let errorMsg = null;
    if ((nodeInfo.source.type === '') || (nodeInfo.target.type === '')) {
      errorMsg = 'Source and/or Target Node type needs to be specified...';
    }
    if (nodeInfo.source.deleted || nodeInfo.target.deleted) {
      errorMsg = 'Source and/or Target Node references a deleted node...';
    }
    if (errorMsg) {
      this.predicateList = [];
      this.predicateFetchError = errorMsg;
      this.awaitingPredicateList = false;
      return;
    }
    const key = `${nodeInfo.source.type}:${nodeInfo.target.type}`;
    if (this.predicateCache.has(key)) {
      this.predicateList = this.predicateCache.get(key);
    } else {
      this.awaitingPredicateList = true;
      // const fakePredicateList = ['increases', 'decreases', 'cures', 'other'];
      const fakePredicateList = [];
      const predicateList = yield new Promise((resolve, reject) => setTimeout(() => resolve(fakePredicateList), 10));
      this.predicateCache.set(key, predicateList);
      this.predicateList = predicateList;
    }
    this.predicateFetchError = null;
    this.awaitingPredicateList = false;
    // console.log(`getPredicateListFake returned for (${nodeInfo.source.type}, ${nodeInfo.target.type}):`, this.predicateList);
  });

  // Get list of panels of specific type from panelState
  getPanelsByType(panelType) {
    const panels = [];
    this.panelState.forEach((panel) => {
      if (panel.panelType === panelType) {
        panels.push(panel);
      }
    });
    return panels;
  }

  @computed get nodePanels() {
    return this.getPanelsByType(panelTypes.node);
  }

  @computed get edgePanels() {
    return this.getPanelsByType(panelTypes.edge);
  }

  // Return list of ids for nodes that are not flagged with deleted = true
  @computed get visibleNodePanels() {
    return this.nodePanels.filter(panel => !panel.deleted);
  }

  // panelType is from panelTypes ENUM
  getIdListByType(panelType) {
    return this.getPanelsByType(panelType).map(panel => panel.id);
  }

  // Returns a list of all the node ids in this.panelState
  // This includes any "hidden" nodes with deleted = true
  nodeIdList() {
    return this.getIdListByType(panelTypes.node);
  }

  // Return list of ids for nodes that are not flagged with deleted = true
  visibleNodeIdList() {
    return this.nodePanels.filter(panel => !panel.deleted).map(panel => panel.id);
  }

  // Closest ind (for panelState) corresponding to all EdgePanels and
  // any NodePanel that has not been flagged for deletion. Returns -1 if no valid panels exist
  closestNonDeletedPanelInd(ind) {
    const panelInds = [];
    this.panelState.forEach((panel, i) => {
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

  // Returns a list of all the edge ids in this.panelState
  edgeIdList() {
    return this.getIdListByType(panelTypes.edge);
  }

  // Returns if specific node id is valid (exists in panelState)
  isValidNode(id) {
    if (id === null) {
      return false;
    }
    const nodeIds = this.nodeIdList();
    return nodeIds.indexOf(id) !== -1;
  }

  // Returns null if no active element or editing a new panel
  // Returns {type: 'node', id: 0} or {type: 'edge', id: 0}
  activePanelToGraphElement() {
    if ((!this.isActivePanel) || (this.activePanelInd === this.panelState.length)) {
      return null;
    }
    return { type: this.activePanelState.panelType, id: this.activePanelState.id };
  }

  // Determine if activePanelState is different from the corresponding
  // saved panel state
  @computed get isUnsavedChanges() {
    if (!this.isActivePanel) {
      return false; // Nothing to save if no active panel
    }
    if (this.activePanelInd === this.panelState.length) {
      return true; // This is an unsaved panel
    }
    return !this.panelState[this.activePanelInd].isEqual(this.activePanelState); // Uses Panel isEqual class method
  }

  // Is a panel (input or output currently selected / being edited)
  @computed get isActivePanel() {
    return !_.isEmpty(this.activePanelState);
  }

  @action.bound syncActivePanelToPanelInd() {
    if (this.panelState.length === 0) {
      this.activePanelState = {};
      this.activePanelInd = 0;
      return;
    }
    if (this.activePanelInd >= this.panelState.length) {
      this.activePanelInd = this.panelState.length - 1;
    }
    this.activePanelState = this.panelState[this.activePanelInd].clone();
  }

  // graphState should be a value from graphStates Enum
  @action.bound setGraphState(graphState) {
    this.graphState = graphState;
  }

  @action.bound updateQuestionName(questionName) {
    this.questionName = questionName;
  }

  // Compute machineQuestion representation of graph from internal PanelState
  // Binds isSelected = true to the node/edge that is currently active
  // Used by by vis-js graphing primarily
  @computed get machineQuestion() {
    if (this.panelState.length === 0) {
      return null;
    }
    const machineQuestion = this.getEmptyMachineQuestion();
    const graphElementBlob = this.activePanelToGraphElement();
    this.panelState.forEach((panel) => {
      if (this.isNode(panel)) {
        const panelAsJson = panel.toJsonObj();
        if ((graphElementBlob !== null) && (graphElementBlob.type === panelTypes.node) && (graphElementBlob.id === panel.id)) {
          panelAsJson.isSelected = true; // Set isSelected = true for selected node/edge
        }
        panelAsJson.label = panel.panelName;
        machineQuestion.nodes.push(panelAsJson);
      }
      if (this.isEdge(panel)) {
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
  @computed get getMachineQuestionSpecJson() {
    const machineQuestion = this.getEmptyMachineQuestion();
    const nodeIdMap = new Map(); // Mapping between internal integer ids to string ids for external consumption
    this.panelState.forEach((panel) => {
      if (this.isNode(panel)) {
        nodeIdMap.set(panel.id, `n${panel.id}`); // Convert integer id back to string for export
      }
    });
    this.panelState.forEach((panel) => {
      if (this.isNode(panel)) {
        const { deleted, curieEnabled, ...panelJson } = panel.toJsonObj();
        panelJson.id = nodeIdMap.get(panelJson.id);
        machineQuestion.nodes.push(panelJson);
      }
      if (this.isEdge(panel)) {
        const { predicate, ...panelJson } = panel.toJsonObj();
        const typeObj = predicate ? { type: predicate } : {}; // Remap internal `predicate` field to `type` field
        panelJson.id = `e${panelJson.id}`; // Convert integer id back to string for export
        panelJson.source_id = nodeIdMap.get(panelJson.source_id);
        panelJson.target_id = nodeIdMap.get(panelJson.target_id);
        machineQuestion.edges.push(Object.assign({}, typeObj, panelJson));
      }
    });
    return { natural_question: this.questionName, machine_question: machineQuestion };
  }

  /**
   * Convert JSON workflow input format to internal Panel State representation.
   * this.panelState is set to an Array in internal Panel state representation of form:
   * [ InputPanel instance, OperationPanel instance, ... ]
   * Note: This method overwrites all supplied node/edge ids to internal integer representation
   *
   * @param {JSON Object} machineQuestionInp - JSON Object satisfying MachineQuestion spec
   *  of format { question: string, machineQuestion: { edges: [], nodes: [] }}
   */
  @action.bound machineQuestionSpecToPanelState(machineQuestionInp) {
    try {
      console.log('Loading machineQuestionJson -', machineQuestionInp);
      this.resetQuestion();
      const machineQuestionInput = _.cloneDeep(machineQuestionInp);
      this.questionName = machineQuestionInput.natural_question ? machineQuestionInput.natural_question : '';

      // Store mapping of original node/edge ids to internal representation and update panelState
      // with NodePanel and EdgePanel objects
      const nodeIdMap = new Map();
      machineQuestionInput.machine_question.nodes.forEach((node) => {
        const { id, ...nodeContents } = node;
        const newNodePanel = new NodePanel(this, nodeContents);
        nodeIdMap.set(id, newNodePanel.id);
        this.panelState.push(newNodePanel);
      });
      machineQuestionInput.machine_question.edges.forEach((edge, i) => {
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
        this.panelState.push(new EdgePanel(this, edgeObj));
      });

      // Reset activePanel to 1st panel/node
      this.activePanelState = this.panelState.length > 0 ? this.panelState[0].clone() : {};
      this.activePanelInd = 0;
      if (this.panelState.length > 0) {
        this.setGraphState(graphStates.display);
      } else {
        this.setGraphState(graphStates.empty);
      }
    } catch (err) {
      this.resetQuestion();
      this.setGraphState(graphStates.error);
      console.error('Failed to read this Question template', err);
      window.alert('Failed to read this Question template. Are you sure this is valid?');
    }
  }

  // Checks if Graph UI is fully valid and returns object
  // of form { isValid: bool, isValidGraph: bool, errorList: Array of strings }
  @computed get graphValidationState() {
    let isValid = true;
    let isValidGraph = true;
    let errorList = [];
    if (!this.nodePanels.reduce((prev, panel) => prev && panel.isValid, true)) {
      isValidGraph = false;
      errorList.push('One or more invalid nodes');
    }
    if (!this.edgePanels.reduce((prev, panel) => prev && panel.isValid, true)) {
      isValidGraph = false;
      errorList.push('One or more invalid edges');
    }
    if (this.questionName.length === 0) {
      isValid = false;
      errorList.push('Please enter a valid question name');
    }
    return { isValid: isValid && isValidGraph, isValidGraph, errorList };
  }

  // Checks only if graph part of the question is valid
  @computed get isValidGraph() {
    return this.panelState.reduce((prev, panel) => prev && panel.isValid);
  }

  getEmptyMachineQuestion() {
    return {
      nodes: [], // { id, name?, type, curie? }
      edges: [], // { id, source_id, target_id, predicate? }
    };
  }

  isNode(panel) {
    return panel.panelType === panelTypes.node;
  }

  isEdge(panel) {
    return panel.panelType === panelTypes.edge;
  }

  @action.bound resetQuestion() {
    this.questionName = '';
    this.graphState = graphStates.empty;
    this.panelState = [];
    this.activePanelInd = 0;
    this.activePanelState = {};
    this.predicateList = [];
    this.awaitingPredicateList = false;
    this.predicateFetchError = null;
  }

  @action.bound newActivePanel(panelType) {
    if (panelType === panelTypes.node) {
      this.activePanelState = new NodePanel(this);
    }
    if (panelType === panelTypes.edge) {
      // If a node was previously selected when clicking "New Edge", the source-id
      // for the new edge is pre-populated with a reference to the initially selected node
      if (this.isNode(this.panelState[this.activePanelInd])) {
        this.activePanelState = new EdgePanel(this, { source_id: this.panelState[this.activePanelInd].id });
      } else {
        this.activePanelState = new EdgePanel(this);
      }
    }
    this.activePanelInd = this.panelState.length;
  }

  // Revert any unsaved changes in a panel for an existing node
  @action.bound revertActivePanel() {
    this.activePanelState = this.panelState[this.activePanelInd].clone();
  }

  @action.bound deleteActivePanel() {
    // Handle if deleting an existing node in graph
    if (this.activePanelInd < this.panelState.length) {
      // Remove if edge panel
      if (this.activePanelState.panelType === panelTypes.edge) {
        this.panelState.splice(this.activePanelInd, 1); // Delete the edgePanel
      } else {
        // Flag nodePanel as 'deleted'
        this.panelState[this.activePanelInd].deleted = true;
        // Flag any broken edges with a `broken` field for graph display
        const deletedNodeId = this.panelState[this.activePanelInd].id;
        this.edgePanels.forEach((edgePanel) => {
          if ((edgePanel.source_id === deletedNodeId) || (edgePanel.target_id === deletedNodeId)) {
            edgePanel.broken = true; // eslint-disable-line no-param-reassign
          }
        });
      }
    }
    // Update activePanelInd and activePanelState accordingly
    this.syncActivePanelToClosestNonDeletedPanelInd();
  }

  // Sets this.activePanelInd to closest ind that is not deleted or an edge. Also
  // updates activePanelState accordingly.
  @action syncActivePanelToClosestNonDeletedPanelInd() {
    // Update activePanelInd and activePanelState accordingly
    const activePanelInd = this.closestNonDeletedPanelInd(this.activePanelInd);
    if (activePanelInd === -1) {
      this.activePanelInd = this.panelState.length;
      this.activePanelState = {};
    } else {
      this.activePanelInd = activePanelInd;
      this.activePanelState = this.panelState[this.activePanelInd].clone();
    }
  }

  @action.bound saveActivePanel() {
    this.panelState[this.activePanelInd] = this.activePanelState.clone();
    if (this.isEdge(this.panelState[this.activePanelInd])) {
      // Saving an edge means it has to be valid, so `broken` param must be false
      this.panelState[this.activePanelInd].broken = false;
    }
    this.graphState = graphStates.display;
  }

  @action.bound updateActivePanelFromNodeId(id) {
    let nodePanelInd = null;
    this.panelState.forEach((p, i) => {
      if ((p.panelType === panelTypes.node) && (p.id === id) && (!p.deleted)) {
        nodePanelInd = i;
      }
    });
    if (nodePanelInd !== null) { // TODO: Consider updating only if activePanelInd differs from nodePanelInd
      this.activePanelInd = nodePanelInd;
      this.activePanelState = this.panelState[nodePanelInd].clone();
    }
  }

  @action.bound updateActivePanelFromEdgeId(id) {
    let edgePanelInd = null;
    this.panelState.forEach((p, i) => {
      if ((p.panelType === panelTypes.edge) && (p.id === id)) {
        edgePanelInd = i;
      }
    });
    if (edgePanelInd !== null) {
      this.activePanelInd = edgePanelInd;
      this.activePanelState = this.panelState[edgePanelInd].clone();
      console.log('In updateActivePanelFromEdgeId - Updated activePanelState');
    }
  }

  // Async action to update concepts list and conceptsReady flag in store
  updateConcepts = flow(function* () { // eslint-disable-line func-names
    try {
      const concepts = yield (() => new Promise((resolve, reject) => {
        this.appConfig.concepts(c => resolve(c), err => reject(err));
      }))();
      // console.log('Concepts returned:', concepts);
      this.concepts = concepts;
      this.conceptsReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX store concepts entry', e);
    }
  }).bind(this);

  // Async action to update user and userReady flag in store
  updateUser = flow(function* () { // eslint-disable-line func-names
    try {
      // const concepts = yield this.appConfig.concepts(c => Promise.resolve(c));
      const user = yield (() => new Promise((resolve, reject) => {
        this.appConfig.user(u => resolve(u), err => reject(err));
      }))();
      console.log('User returned:', user);
      this.user = user;
      this.userReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX user entry', e);
    }
  }).bind(this);

  // Async action to submit natural language question to NLP parser and
  // obtain the corresponding machine-question from the NLP engine
  nlpParseQuestion = flow(function* () { // eslint-disable-line func-names
    try {
      const question = this.questionName;
      this.nlpFetching = true;
      const machineQuestion = yield (() => new Promise((resolve, reject) => {
        this.appConfig.questionNewTranslate(question, mq => resolve(mq), err => reject(err));
      }))();
      console.log('NLP Engine returned:', machineQuestion);
      this.machineQuestionSpecToPanelState({ natural_question: question, machine_question: machineQuestion });
      this.nlpFetching = false;
    } catch (e) {
      this.resetQuestion();
      this.setGraphState(graphStates.error);
      this.nlpFetching = false;
      console.error('Failed to retrieve and update MobX store with NLP parser outputs', e);
    }
  }).bind(this);

  // Set store state based on question data from provided question-id
  // If id is '', then dataReady set to True since no template provided
  getQuestionData = flow(function* (id) { // eslint-disable-line func-names
    if (id === '') {
      this.dataReady = true;
      return;
    }
    try {
      // const concepts = yield this.appConfig.concepts(c => Promise.resolve(c));
      const data = yield (() => new Promise((resolve, reject) => {
        this.appConfig.questionData(id, u => resolve(u), err => reject(err));
      }))();
      console.log('Question template returned:', data);
      this.machineQuestionSpecToPanelState({
        natural_question: data.question.natural_question,
        machine_question: data.question.machine_question,
      });
      this.dataReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX store with question template data', e);
    }
  }).bind(this);

  // Dispose all reactions so they are garbage collected when store is
  // destroyed (invoke in componentWillUnmount of root React component)
  cleanup() {
    this.disposeAutoFetchPredicateList();
    this.disposeDeleteUnlinkedNodes();
    this.disposeGraphStateEmpty();
  }
}

export default NewQuestionStore;
export { panelTypes };
