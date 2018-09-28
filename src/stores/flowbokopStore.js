import { observable, action, computed, flow, toJS, configure, autorun, reaction, runInAction } from 'mobx';

import { graphStates } from '../components/flowbokop/FlowbokopGraphFetchAndView';
import AppConfig from '../AppConfig';

const config = require('../../config.json');
const _ = require('lodash');

configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

// ENUM for active tab to display for a panel
const activeTabKeys = {
  configure: 1,
  results: 2,
};

const panelTypes = {
  input: 'input',
  operation: 'operation',
};

class InputPanel {
  inputType = panelTypes.input;
  @observable inputLabel = '';
  @observable data = [{ type: 'disease', curie: '', label: '' }];

  constructor(flowbokopStore, userObj = {}) { // User can optionally supply { inputLabel, data }
    this.store = flowbokopStore;
    const { inputLabel, data } = userObj;
    if (inputLabel) {
      this.inputLabel = inputLabel;
    }
    if (data) {
      this.data = data;
    }
  }

  @computed get concepts() {
    return this.store.concepts;
  }

  // Return results curie list for this panel
  @computed get result() {
    if (_.isEmpty(this.store.workflowResult) || !this.store.workflowResult[this.varName]) {
      return [];
    }
    return this.store.workflowResult[this.varName];
  }

  // Does this panel have any results
  @computed get hasResult() {
    return this.result.length > 0;
  }

  defaultCurie() {
    return { type: 'disease', curie: '', label: '' };
  }

  @computed get varName() {
    return this.inputLabel;
  }

  /**
   * Determines if contents of this instance matches another
   * @param {Object} other - Other Panel like object
   */
  isEqual(other) {
    if (!(other instanceof InputPanel)) {
      return false;
    }
    return _.isEqual(this.inputLabel, other.inputLabel) &&
      _.isEqual(toJS(this.data), toJS(other.data));
  }

  // Make a deep clone of this instance
  clone() {
    return new InputPanel(this.store, {
      inputLabel: toJS(this.inputLabel),
      data: toJS(this.data),
    });
  }

  // Convert to JSON object representation
  toJsonObj() {
    const {
      inputType, isValid, inputLabel, data,
    } = this;
    return {
      inputType, isValid, inputLabel, data: toJS(data),
    };
  }

  @computed get isValidLabel() {
    return /^[a-z0-9_ ]+$/i.test(this.inputLabel);
  }

  isValidCurie(val) {
    return /^[a-z0-9_\+\-]+:[a-z0-9_\+\-]+/i.test(val); // eslint-disable-line no-useless-escape
  }

  @computed get isValidCurieList() {
    let val = toJS(this.data);
    if (_.isPlainObject(val)) {
      val = [val];
    }
    let isValid = true;
    val.forEach((curieObj) => {
      const { curie, type } = curieObj;
      isValid = isValid && this.isValidCurie(curie);
      isValid = isValid && (this.concepts.indexOf(type) > -1); // Ensure type is in concept list
    });
    // Ensure all types in the CurieList are identical
    if (isValid) {
      const curieTypes = val.map(curieBlob => curieBlob.type);
      isValid = isValid && curieTypes.every((t, i, arr) => t === arr[0]);
    }
    return isValid;
  }

  // Returns true if all items in this panel are valid
  @computed get isValid() {
    return this.isValidLabel && this.isValidCurieList;
  }

  @action.bound addCurie() {
    const newCurie = this.defaultCurie();
    newCurie.type = this.data[0].type; // Ensure type of successive curie entries are consistent with original
    this.data.push(newCurie);
    // const keys = _.cloneDeep(this.state.keys); TODO:
    // keys.push(shortid.generate());
  }

  @action.bound deleteCurie(i) {
    // const keys = _.cloneDeep(this.state.keys); TODO:
    // keys.splice(i, i);
    this.data.splice(i, 1);
  }

  @action.bound updateCurie(i, type, label, curie) {
    this.data[i] = { type, label, curie };
    // const keys = _.cloneDeep(this.state.keys); // TODO:

    // Check if type of 1st Curie List was changed
    if ((i === 0) && (this.data.length > 1) && (this.data[0].type !== this.data[1].type)) {
      this.data.splice(1); // Delete all other CurieSelectors except first
      // keys.splice(1); TODO:
    }
  }

  @action.bound updateInputLabel(value) {
    this.inputLabel = value;
  }
}

class OperationPanel {
  inputType = panelTypes.operation;
  // @observable result = [];
  @observable data = {
    input: [],
    output: '',
    label: '',
    service: '',
    options: '',
  };

  constructor(flowbokopStore, userObj = {}) { // User can optionally supply { result, data }
    this.store = flowbokopStore;
    const { data } = userObj;
    if (data) {
      if (typeof data.input === 'string' || data.input instanceof String) {
        data.input = [data.input]; // Ensure that input is always an array
      }
      this.data = data;
    }
  }

  @computed get varName() {
    return this.data.output;
  }

  // Return results curie list for this panel
  @computed get result() {
    if (_.isEmpty(this.store.workflowResult) || !this.store.workflowResult[this.varName]) {
      return [];
    }
    return this.store.workflowResult[this.varName];
  }

  // Does this panel have any results
  @computed get hasResult() {
    return this.result.length > 0;
  }

  @action.bound updateField(field, value) { // eslint-disable-line consistent-return
    switch (field) {
      case 'input':
        return this.data.input = value; // eslint-disable-line no-return-assign
      case 'output':
        return this.data.output = value; // eslint-disable-line no-return-assign
      case 'label':
        return this.data.label = value; // eslint-disable-line no-return-assign
      case 'service':
        return this.data.service = value; // eslint-disable-line no-return-assign
      case 'options':
        return this.data.options = value; // eslint-disable-line no-return-assign
      default:
        console.error(`Invalid field - ${field} supplied to OutputPanel.updateField action`);
    }
  }

  /**
   * Determines if contents of this instance matches another
   * @param {Object} other - Other Panel like object
   */
  isEqual(other) {
    if (!(other instanceof OperationPanel)) {
      return false;
    }
    return _.isEqual(toJS(this.data), toJS(other.data));
  }

  // Make a deep clone of this instance
  clone() {
    return new OperationPanel(this.store, { data: toJS(this.data) });
  }

  // Convert to JSON object representation
  toJsonObj() {
    const {
      inputType, isValid, data,
    } = this;
    return {
      inputType, isValid, data: toJS(data),
    };
  }

  @computed get isValidInput() {
    return this.data.input.length > 0;
  }

  @computed get isValidOutput() {
    return /^[a-z0-9_]+$/i.test(this.data.output);
  }

  @computed get isValidLabel() {
    return /^[a-z0-9_ ]+$/i.test(this.data.label);
  }

  @computed get isValidService() {
    const urlRegexp = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=/]*$/i; // eslint-disable-line no-useless-escape
    return urlRegexp.test(this.data.service);
  }

  @computed get isValidOptions() {
    if (this.data.options === '') {
      return true;
    }
    try {
      JSON.parse(this.data.options);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Determine if all input options are valid
   */
  @computed get isValid() {
    const isValid = (
      this.isValidInput && this.isValidOutput &&
      this.isValidLabel && this.isValidService &&
      this.isValidOptions);
    return isValid;
  }
}

class FlowbokopStore {
  @observable user = {};
  @observable userReady = false;
  @observable dataReady = false;

  @observable queryGraph = { nodes: [], edges: [] };
  @observable graphState = graphStates.empty;
  @observable workflowResult = {};
  @observable panelState = [];

  @observable activePanelInd = 0;
  @observable activePanelState = {};
  @observable activeTab = activeTabKeys.configure;

  @observable concepts = [];

  disposeReactionGetGraph = null;

  constructor() {
    this.appConfig = new AppConfig(config);
    this.updateConcepts();

    // Always request getGraph any time panelState changes
    // TODO: Probably need to prevent this.getGraph from running if panelState is empty array (resetGraph)
    this.disposeReactionGetGraph = reaction(
      () => this.panelState.slice(),
      (panelState) => {
        if (!_.isEmpty(panelState)) {
          console.log('ran reaction... calling getGraph(): panelState = ', panelState);
          this.getGraph();
        }
      },
    );
  }

  // Async action to update concepts list and dataReady flag in store
  updateConcepts = flow(function* () { // eslint-disable-line func-names
    try {
      // const concepts = yield this.appConfig.concepts(c => Promise.resolve(c));
      const concepts = yield (() => new Promise((resolve, reject) => {
        this.appConfig.concepts(c => resolve(c), err => reject(err));
      }))();
      console.log('Concepts returned:', concepts);
      this.concepts = concepts;
      this.dataReady = true;
      // // Demo default panel state when store is instantiated
      // this.panelState = [
      //   new InputPanel(this, {
      //     inputLabel: 'usher1',
      //     data: [{ type: 'disease', curie: 'MONDO:0010168', label: 'Usher syndrome type 1' }],
      //   }),
      //   new OperationPanel(this, {
      //     data: {
      //       input: 'usher1',
      //       output: 'usher1_genes',
      //       service: 'http://127.0.0.1/api/flowbokop/expand/disease/gene/',
      //       options: '',
      //     },
      //   }),
      // ];
    } catch (e) {
      console.error('Failed to retrieve and update MobX store concepts entry', e);
    }
  }).bind(this);

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

  // Convert internal panel state representation to Flowbokop workflow input
  // representation that is required to be POSTed to the Flowbokop endpoint
  panelStateToWorkflowInputs() {
    const workflowInputs = { input: {}, options: { output: 'all', operations: [] } };
    this.panelState.forEach((panelInstance) => {
      if (panelInstance.inputType === panelTypes.input) {
        workflowInputs.input[toJS(panelInstance.inputLabel)] = toJS(panelInstance.data);
      }
      if (panelInstance.inputType === panelTypes.operation) {
        const panelInstanceData = toJS(panelInstance.data);
        if (Object.hasOwnProperty.call(panelInstanceData, 'options')) {
          if (panelInstanceData.options === '') {
            delete panelInstanceData.options; // Remove options if it is empty string
          }
        }
        workflowInputs.options.operations.push(panelInstanceData);
      }
    });
    return workflowInputs;
  }

  // Up-to-date list of output varNames for each node/panel
  @computed get outputVarNameList() {
    if (this.panelState.length === 0) {
      return [];
    }
    return this.panelState.map(panel => panel.varName);
  }

  // graphState should be a value from graphStates Enum
  @action.bound setGraphState(graphState) {
    this.graphState = graphState;
  }

  /**
   * Convert JSON workflow input format to internal Panel State representation.
   * this.panelState is set to an Array in internal Panel state representation of form:
   * [ InputPanel instance, OperationPanel instance, ... ]
   * @param {JSON Object} workflowInp - Flowbokop Workflow input specification
   */
  @action.bound workflowInputsToPanelState(workflowInp) {
    const panelState = [];
    const workflowInput = _.cloneDeep(workflowInp);
    if (Object.hasOwnProperty.call(workflowInput, 'input')) {
      const inputLabels = Object.keys(workflowInput.input);
      inputLabels.forEach((inputLabel) => {
        const isCurieListArray = Array.isArray(workflowInput.input[inputLabel]);
        // Ensure data is always an array
        panelState.push(new InputPanel(this, { inputLabel, data: isCurieListArray ? workflowInput.input[inputLabel] : [workflowInput.input[inputLabel]] }));
      });
    }
    if (Object.hasOwnProperty.call(workflowInput, 'options')) {
      if (Object.hasOwnProperty.call(workflowInput.options, 'operations')) {
        workflowInput.options.operations.forEach((operationData) => {
          let options = '';
          // Always convert input(s) into a list of string(s)
          if (typeof operationData.input === 'string' || operationData.input instanceof String) {
            operationData.input = [operationData.input]; // eslint-disable-line no-param-reassign
          }
          if (Object.hasOwnProperty.call(operationData, 'options')) {
            if (typeof operationData.options === 'string' || operationData.options instanceof String) {
              ({ options } = operationData);
            }
          }
          panelState.push(new OperationPanel(this, { data: Object.assign({}, operationData, { options }) }));
        });
      }
    }
    this.panelState = panelState;
    // Reset activePanel to 1st panel/node
    this.activePanelState = this.panelState.length > 0 ? this.panelState[0].clone() : {};
    this.activePanelInd = 0;
  }

  // List of all unique input/operation variable names
  @computed get inputList() {
    const inputList = [];
    const { panelState } = this;
    panelState.forEach((panelObj) => {
      inputList.push(panelObj.varName);
    });
    return Array.from(new Set(inputList)).sort();
  }

  @action.bound newActivePanel(panelType) {
    this.activePanelInd = this.panelState.length;
    if (panelType === panelTypes.input) {
      this.activePanelState = new InputPanel(this);
    }
    if (panelType === panelTypes.operation) {
      this.activePanelState = new OperationPanel(this);
    }
  }

  // Revert any unsaved changes in a panel for an existing node
  @action.bound revertActivePanel() {
    this.activePanelState = this.panelState[this.activePanelInd].clone();
  }

  @action.bound deleteActivePanel() {
    // Handle if deleting an existing node in graph
    if (this.activePanelInd < this.panelState.length) {
      this.panelState.splice(this.activePanelInd, 1); // Delete the panel
      this.activePanelInd = this.activePanelInd > 0 ? this.activePanelInd - 1 : 0;
      if (this.panelState.length >= this.activePanelInd + 1) {
        this.activePanelState = this.panelState[this.activePanelInd].clone();
      } else {
        this.activePanelState = {};
      }
    } else {
      // Handle when deleting new node panel (that was not patched into panelState)
      this.activePanelInd = 0;
      this.activePanelState = this.panelState.length > 0 ? this.panelState[this.activePanelInd].clone() : {};
    }
  }

  @action.bound saveActivePanel() {
    if (this.activePanelInd < this.panelState.length) {
      // Check if "output" name for block changed and rename
      // the matching input in all other blocks (only if editing existing block)
      const newOutputLabel = this.activePanelState.varName;
      const oldOutputLabel = this.panelState[this.activePanelInd].varName;
      if (newOutputLabel !== oldOutputLabel) {
        // Rename input term in all other operation blocks that references renamed output
        this.panelState.forEach((panelObj) => {
          if (panelObj.data.input) {
            // Handle when input is a simple string of a single input variable
            if (typeof panelObj.data.input === 'string' || panelObj.data.input instanceof String) {
              throw new Error('data.input field for an OperationPanel should always be an Array of strings, not a string');
            }
            // Handle when input is a list of input variables
            const oldLabelInd = panelObj.data.input.indexOf(oldOutputLabel);
            if (oldLabelInd >= 0) {
              panelObj.data.input[oldLabelInd] = newOutputLabel; // eslint-disable-line no-param-reassign
            }
          }
        });
      }
    }
    this.panelState[this.activePanelInd] = this.activePanelState.clone();
  }

  /**
   * Updates state to reflect active panel to match that of the provided node-id
   * If the node-id corresponds to the output node, no action is taken
   * @param {Int} id - Id of the node in the queryGraph data structure
   * @returns {Int} panel index corresponding to the node with id: `id`. -1 for output node.
   */
  @action.bound updateActivePanelFromNodeId(id) {
    const nodeOfInterest = this.queryGraph.nodes.filter(n => (n.id === id));
    if (nodeOfInterest[0].is_output) {
      return;
    }
    const nodeOutputLabel = nodeOfInterest[0].is_input ? nodeOfInterest[0].name : nodeOfInterest[0].operation.output;
    let panelInd;
    this.panelState.forEach((panelInstance, i) => {
      if (panelInstance.varName === nodeOutputLabel) {
        panelInd = i;
      }
    });
    this.activePanelInd = panelInd;
    this.activePanelState = this.panelState[panelInd].clone();
  }


  /**
   * Fetch query graph from Flowbokop /graph endpoint in async manner
   * and display status accordingly in UI. Any existing results will
   * be invalidated and deleted.
   */
  getGraph = flow(function* () { // eslint-disable-line func-names
    console.log('Input to graph endpoint:', this.panelStateToWorkflowInputs(this.panelState));
    // Don't query /graph endpoint if we don't have any data
    if (_.isEmpty(this.panelState)) {
      this.graphState = graphStates.empty;
      return;
    }
    this.graphState = graphStates.fetching;
    // Wrap async request to return a Promise for compatibility with MobX yield
    const wrappedAsyncReq = () => new Promise((resolve, reject) => {
      this.appConfig.flowbokopGraph(
        this.panelStateToWorkflowInputs(this.panelState),
        data => resolve(data),
        err => reject(err),
      );
    });

    try {
      // Convert callback format of AppConfig api to a Promise returning method that is IIFE
      const graphData = yield wrappedAsyncReq();
      console.log('Returned graph data:', graphData);
      this.queryGraph = graphData;
      this.graphState = this.isNonEmptyGraph() ? graphStates.display : graphStates.empty;
      this.workflowResult = {}; // Reset results to empty
      this.activeTab = activeTabKeys.configure;
    } catch (e) {
      console.error('Error in getGraph:', e);
      this.graphState = graphStates.error;
    }
  }).bind(this);

  // Update data structure with Flowbokop results after "Submitting" workflow
  onSubmitWorkflow = flow(function* () { // eslint-disable-line func-names
    this.graphState = graphStates.fetching;
    // Wrap async request to return a Promise for compatibility with MobX yield
    const wrappedAsyncReq = () => new Promise((resolve, reject) => {
      this.appConfig.flowbokopExecute(
        this.panelStateToWorkflowInputs(),
        data => resolve(data),
        err => reject(err),
      );
    });

    try {
      const workflowResult = yield wrappedAsyncReq();
      this.graphState = graphStates.display;
      this.workflowResult = workflowResult;
      this.activeTab = activeTabKeys.results;
    } catch (e) {
      console.error('Flowbokop execution endpoint failed to return results', e);
    }
  }).bind(this);

  isNonEmptyGraph() {
    return 'nodes' in this.queryGraph && this.queryGraph.nodes.length > 0;
  }

  @action.bound resetGraph() {
    this.queryGraph = { nodes: [], edges: [] };
    this.graphState = graphStates.empty;
    this.workflowResult = {};
    this.panelState = [];

    this.activePanelInd = 0;
    this.activePanelState = {};
    this.activeTab = activeTabKeys.configure;
  }

  // Change the active tab being shown for a panel
  @action.bound onChangeTab(key) {
    this.activeTab = key;
  }
}


export default new FlowbokopStore(); // Export singleton store instance
export { activeTabKeys, panelTypes };
