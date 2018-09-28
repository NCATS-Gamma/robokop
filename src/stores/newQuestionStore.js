import { observable, action, computed, flow, toJS, configure, autorun, reaction, runInAction } from 'mobx';

import { graphStates } from '../components/flowbokop/FlowbokopGraphFetchAndView';
import AppConfig from '../AppConfig';

const config = require('../../config.json');
const _ = require('lodash');

configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

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
  panelType = panelTypes.edge;

  _publicFields = ['id', 'source_id', 'target_id', 'predicate'];

  constructor(store, userObj) {
    this.store = store;
    runInAction(() => {
      this.id = this.getUniqueId();
      // Assign any supplied params to this instance
      this._publicFields.forEach((field) => { // eslint-disable-line no-underscore-dangle
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

  @computed get isValid() { // TODO: Check against store to ensure source_id and target_id are valid
    return (this.source_id && this.source_id > -1) && (this.target_id && this.target_id > -1);
  }

  // Make a deep clone of this instance
  clone() {
    const userObj = {};
    this._publicFields.forEach(field => userObj[field] = toJS(this[field])); // eslint-disable-line no-underscore-dangle
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
  @observable set = false;
  panelType = panelTypes.node;

  _publicFields = ['id', 'name', 'type', 'curie', 'set'];

  constructor(store, userObj) {
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
    });
  }

  // Returns lowest non-zero integer id not already used
  getUniqueId() {
    const candidateIds = _.range(this.store.panelState.length + 1);
    const currentIds = this.store.nodeIdList();
    return _.difference(candidateIds, currentIds).sort()[0];
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
        // const isValidCurie = curieVal.reduce((isValid, curie) => isValid && this.isValidCurie(curie), true);
        // if (isValidCurie) {
        //   this[field] = curieVal;
        // }
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

  // Curie selection disabled if this.curie is an empty array
  @computed get isCurieEnabled() {
    return this.curie.length !== 0;
  }

  @computed get isValidCurieList() {
    if (!this.isCurieEnabled) {
      return true; // If curie not enabled, this should return true
    }
    let curieList = toJS(this.curie);
    if (_.isPlainObject(curieList)) {
      curieList = [curieList];
    }
    let isValid = true;
    curieList.forEach((curie) => {
      isValid = isValid && this.isValidCurie(curie);
    });
    return isValid;
  }

  @computed get isValid() {
    return this.isValidType && this.isValidCurieList;
  }

  // Make a deep clone of this instance
  clone() {
    const userObj = {};
    this._publicFields.forEach(field => userObj[field] = toJS(this[field]));
    return new NodePanel(this.store, userObj);
  }

  // Convert to JSON object representation. Only return "non-empty" field
  toJsonObj() {
    const jsonObj = { id: toJS(this.id), type: toJS(this.type), set: toJS(this.set) };
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

  @observable naturalQuestion = '';
  @observable questionName = '';
  @observable notes = '';
  // @observable machineQuestion = null;
  @observable graphState = graphStates.empty;

  @observable panelState = [];
  @observable activePanelInd = 0;
  @observable activePanelState = {};

  constructor() {
    this.appConfig = new AppConfig(config);
    this.updateConcepts();
    this.updateUser();

    runInAction(() => {
      this.panelState = [
        new NodePanel(this, { id: 0, name: 'imatinib', type: 'chemical_substance', curie: 'CHEMBL:CHEMBL1421' }),
        new NodePanel(this, { id: 1, type: 'gene' }),
        new NodePanel(this, { id: 2, type: 'biological_process', set: true }),
        new NodePanel(this, { id: 3, name: 'asthma', type: 'disease', curie: 'CHEMBL:CHEMBL714' }),
        new EdgePanel(this, { id: 0, source_id: 0, target_id: 1 }),
        new EdgePanel(this, { id: 1, source_id: 1, target_id: 2 }),
        new EdgePanel(this, { id: 2, source_id: 2, target_id: 3 }),
      ];
      this.graphState = graphStates.display;
      this.syncActivePanelToPanelInd();
    });
  }

  // panelType is from panelTypes ENUM
  getIdListByType(panelType) {
    const ids = [];
    this.panelState.forEach((panel) => {
      if (panel.panelType === panelType) {
        ids.push(panel.id);
      }
    });
    return ids;
  }

  // Returns a list of all the node ids in this.panelState
  nodeIdList() {
    return this.getIdListByType(panelTypes.node);
  }

  // Returns a list of all the node ids in this.panelState
  edgeIdList() {
    return this.getIdListByType(panelTypes.edge);
  }

  // Returns null if no active element or editing a new panel
  // Returns {type: 'node', id: 0} or {type: 'edge', id: 0}
  activePanelToGraphElement() {
    if ((!this.isActivePanel) || (this.activePanelInd === this.panelState.length)) {
      return null;
    }
    return { type: this.activePanelState.panelType, id: this.activePanelState.id };
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

  @action.bound newActivePanel(panelType) {
    this.activePanelInd = this.panelState.length;
    if (panelType === panelTypes.node) {
      this.activePanelState = new NodePanel(this);
    }
    if (panelType === panelTypes.edge) {
      this.activePanelState = new EdgePanel(this);
    }
  }

  // Compute machineQuestion representation of graph from internal PanelState
  // Binds isSelected = true to the node/edge that is currently active
  @computed get machineQuestion() {
    if (this.panelState.length === 0) {
      return null;
    }
    const machineQuestion = this.getEmptyMachineQuestion();
    const graphElementBlob = this.activePanelToGraphElement();
    this.panelState.forEach((panel) => {
      if (panel.panelType === panelTypes.node) {
        const panelAsJson = panel.toJsonObj();
        if ((graphElementBlob !== null) && (graphElementBlob.type === panelTypes.node) && (graphElementBlob.id === panel.id)) {
          panelAsJson.isSelected = true; // Set isSelected = true for selected node/edge
        }
        machineQuestion.nodes.push(panelAsJson);
      }
      if (panel.panelType === panelTypes.edge) {
        const panelAsJson = panel.toJsonObj();
        if ((graphElementBlob !== null) && (graphElementBlob.type === panelTypes.edge) && (graphElementBlob.id === panel.id)) {
          panelAsJson.isSelected = true; // Set isSelected = true for selected node/edge
        }
        machineQuestion.edges.push(panelAsJson);
      }
    });
    return machineQuestion;
  }

  getEmptyMachineQuestion() {
    return {
      nodes: [], // { id, name?, type, curie? }
      edges: [], // { id, source_id, target_id, predicate? }
    };
  }

  @action.bound resetQuestion() {
    this.naturalQuestion = '';
    this.questionName = null;
    this.machineQuestion = null;
  }

  @action.bound updateActivePanelFromNodeId(id) {
    let nodePanelInd = null;
    this.panelState.forEach((p, i) => {
      if ((p.panelType === panelTypes.node) && (p.id === id)) {
        nodePanelInd = i;
      }
    });
    if (nodePanelInd !== null) { // TODO: Consider updating only if activePanelInd differs from nodePanelInd
      this.activePanelInd = nodePanelInd;
      this.activePanelState = this.panelState[nodePanelInd].clone();
      console.log('In updateActivePanelFromNodeId - Updated activePanelState');
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
      // const concepts = yield this.appConfig.concepts(c => Promise.resolve(c));
      const concepts = yield (() => new Promise((resolve, reject) => {
        this.appConfig.concepts(c => resolve(c), err => reject(err));
      }))();
      console.log('Concepts returned:', concepts);
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
      this.questionName = data.question.natural_question;
      this.machineQuestion = data.question.machine_question;
      this.dataReady = true;
    } catch (e) {
      console.error('Failed to retrieve and update MobX store with question template data', e);
    }
  }).bind(this);
}

export default NewQuestionStore;
export { panelTypes };
