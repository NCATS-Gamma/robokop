import { observable, action, computed, flow, toJS, configure, autorun, reaction, runInAction } from 'mobx';
// import { observable } from 'mobx-react';

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

  constructor(flowbokopStore, userObj = {}) { // User can optionally supply { inputLabel, result, data }
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
      _.isEqual(this.data, other.data);
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
    let val = this.result;
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
}

class OperationPanel {
  inputType = panelTypes.operation;
  // @observable result = [];
  @observable data = {
    input: '',
    output: '',
    service: '',
    options: '',
  };

  constructor(flowbokopStore, userObj = {}) { // User can optionally supply { result, data }
    this.store = flowbokopStore;
    const { data } = userObj;
    if (data) {
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

  /**
   * Determines if contents of this instance matches another
   * @param {Object} other - Other Panel like object
   */
  isEqual(other) {
    if (!(other instanceof OperationPanel)) {
      return false;
    }
    return _.isEqual(this.data, other.data);
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
    return /^[a-z0-9_ ]+$/i.test(this.data.output);
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
    // const { input, output, label, service, options } = this.data;
    const isValid = (
      this.isValidInput && this.isValidOutput &&
      this.isValidLabel && this.isValidService &&
      this.isValidOptions);
    // console.log('isValidOperation - ', isValid);
    // this.setState({ isValid }, callbackFn);
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

  @observable inputLabelList = [];

  @observable concepts = [];

  disposeReactionGetGraph = null;

  constructor() {
    this.appConfig = new AppConfig(config);
    this.updateConcepts();

    // Always request getGraph any time panelState changes
    // TODO: Make this only react when non-result portion of panelState changes
    this.disposeReactionGetGraph = reaction(
      () => this.panelState.slice(),
      (panelState) => {
        console.log('ran reaction... calling getGraph(): panelState = ', panelState);
        this.getGraph();
      },
    );
  }

  updateConcepts = flow(function* () { // eslint-disable-line func-names
    try {
      // const concepts = yield this.appConfig.concepts(c => Promise.resolve(c));
      const concepts = yield (() => {
        return new Promise((resolve, reject) => {
          this.appConfig.concepts(c => resolve(c));
        });
      })();
      console.log('Concepts returned:', concepts);
      this.concepts = concepts;
      this.dataReady = true;
      this.panelState = [
        new InputPanel(this, {
          inputLabel: 'usher1',
          data: [{ type: 'disease', curie: 'MONDO:0010168', label: 'Usher syndrome type 1' }],
        }),
        new OperationPanel(this, {
          data: {
            input: 'usher1',
            output: 'usher1_genes',
            service: 'http://127.0.0.1/api/flowbokop/expand/disease/gene/',
            options: '',
          },
        }),
      ];
    } catch (e) {
      console.error('Failed to retrieve and update MobX store concepts entry');
    }
  });

  // Determine if activePanelState is different from the corresponding
  // saved panel state
  @computed get isUnsavedChanges() {
    if (!this.isActivePanel) {
      return false; // Nothing to save if no active panel
    }
    if (this.activePanelInd === this.panelState.length) {
      return true; // This is an unsaved panel
    }
    return this.panelState[this.activePanelInd].isEqual(this.activePanelState); // Uses Panel isEqual class method
  }

  // Is a panel (input or output currently selected / being edited)
  @computed get isActivePanel() {
    return !_.isEmpty(this.activePanelState) && (this.activePanelInd === this.panelState.length);
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
    this.activePanelState = this.panelState[this.activePanelInd];
  }

  @action.bound deleteActivePanel() {
    // Handle if deleting an existing node in graph
    if (this.activePanelInd < this.panelState.length) {
      this.panelState.splice(this.activePanelInd, 1); // Delete the panel
      this.activePanelInd = this.activePanelInd > 0 ? this.activePanelInd - 1 : 0;
      if (this.panelState.length >= this.activePanelInd + 1) {
        this.activePanelState = this.panelState[this.activePanelInd];
      } else {
        this.activePanelState = {};
      }
    } else {
      // Handle when deleting new node panel (that was not patched into panelState)
      this.activePanelInd = 0;
      this.activePanelState = this.panelState.length > 0 ? this.panelState[this.activePanelInd] : {};
    }
  }

  @action saveActivePanel() {
    // this.panelState[this.activePanelInd] = this.activePanelState;
    // // Set list of input labels to JSON array instead of a string
    // if (Object.hasOwnProperty.call(activePanelState.data, 'input')) {
    //   if (activePanelState.data.input.includes('[')) {
    //     activePanelState.data.input = JSON.parse(activePanelState.data.input);
    //   }
    // }
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
              throw new Error('data.input field for an InputPanel should always be an Array of strings, not a string');
              // if (panelObj.data.input === oldOutputLabel) {
              //   panelObj.data.input = newOutputLabel;
              // }
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
    this.panelState[this.activePanelInd] = this.activePanelState;
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

    let graphData;
    try {
      // Convert callback format of AppConfig api to a Promise returning method that is IIFE
      graphData = yield (() => {
        return new Promise((resolve, reject) => {
          this.appConfig.flowbokopGraph(
            this.panelStateToWorkflowInputs(this.panelState),
            data => resolve(data),
            err => reject(err),
          );
        });
      })();
      console.log('Returned graph data:', graphData);
    } catch (e) {
      this.graphState = graphStates.error;
      return;
    }

    this.queryGraph = graphData;
    this.graphState = this.isNonEmptyGraph() ? graphStates.display : graphStates.empty;

    // this.setState({ graphState: graphStates.fetching }, () => {
    //   this.appConfig.flowbokopGraph(
    //     panelStateToWorkflowInputs(this.state.panelState),
    //     (data) => {
    //       const validGraph = this.isValidGraph(data);
    //       const graphState = validGraph ? graphStates.display : graphStates.empty;
    //       this.setState({
    //         queryGraph: data,
    //         graphState,
    //         workflowResult: {}, // TODO:
    //         activeTab: activeTabKeys.configure, // TODO:
    //       }, () => this.setState({ panelState: this.updatePanelStateWithResults() }));
    //     },
    //     err => console.log('Error fetching query graph', err),
    //   );
    // });
  });

  // // Update data structure with Flowbokop results after "Submitting" workflow TODO:
  // @action.bound onSubmitWorkflow() {
  //   this.graphState = graphStates.fetching;

  //   this.setState({ graphState: graphStates.fetching }, () => {
  //     this.appConfig.flowbokopExecute(
  //       this.panelStateToWorkflowInputs(),
  //       (data) => {
  //         // const validGraph = this.isValidGraph(data);
  //         // const graphState = validGraph ? graphStates.display : graphStates.empty;
  //         console.log('Flowbokop Execute output:', data);
  //         this.setState({
  //           graphState: graphStates.display,
  //           workflowResult: data,
  //         }, () => this.setState({ panelState: this.updatePanelStateWithResults(), activeTab: activeTabKeys.results }));
  //       },
  //       err => console.log('Error fetching query graph', err),
  //     );
  //   });
  // }

  isNonEmptyGraph() {
    return 'nodes' in this.queryGraph && this.queryGraph.nodes.length > 0;
  }
}

export default new FlowbokopStore(); // Export singleton store instance
