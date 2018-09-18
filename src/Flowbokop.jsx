import React from 'react';
// import PropTypes from 'prop-types';
import { Grid, Row, Col, Button, ButtonGroup, Panel, Popover, OverlayTrigger, Tabs, Tab } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import FaFloppyO from 'react-icons/lib/fa/floppy-o';
import FaTrash from 'react-icons/lib/fa/trash';
import FaPlus from 'react-icons/lib/fa/plus';
import FaPlusSquare from 'react-icons/lib/fa/plus-square';
import FaDownload from 'react-icons/lib/fa/download';
import FaUpload from 'react-icons/lib/fa/upload';
import FaInfoCircle from 'react-icons/lib/fa/info-circle';
import FaUndo from 'react-icons/lib/fa/rotate-left';
import FaPaperPlaneO from 'react-icons/lib/fa/paper-plane-o';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import FlowbokopGraphFetchAndView, { graphStates } from './components/flowbokop/FlowbokopGraphFetchAndView';
import FlowbokopInputBuilder from './components/flowbokop/FlowbokopInputBuilder';
import FlowbokopOperationBuilder from './components/flowbokop/FlowbokopOperationBuilder';
import CurieBrowser from './components/shared/CurieBrowser';


const _ = require('lodash');

// ENUM for active tab to display for a panel
const activeTabKeys = {
  configure: 1,
  results: 2,
};

// Convert internal panel state representation to Flowbokop workflow input
// representation that is required to be POSTed to the Flowbokop endpoint
const panelStateToWorkflowInputs = (panelSt) => {
  const panelState = _.cloneDeep(panelSt);
  const workflowInputs = { input: {}, options: { output: 'all', operations: [] } };
  panelState.forEach((panelData) => {
    if (panelData.inputType === 'input') {
      workflowInputs.input[panelData.inputLabel] = panelData.data;
    }
    if (panelData.inputType === 'operation') {
      if (Object.hasOwnProperty.call(panelData.data, 'options')) {
        if (panelData.data.options === '') {
          delete panelData.data.options; // Remove options if it is empty string
        }
      }
      workflowInputs.options.operations.push(panelData.data);
    }
  });
  return workflowInputs;
};

// Buttons displayed in title-bar of Graph Viewer
const GraphTitleButtons = ({
  onDropFile, onDownloadWorkflow, onResetGraph, onSubmitWorkflow,
}) => {
  const buttonStyles = { padding: '2px', marginLeft: '5px' };
  return (
    <div style={{ position: 'relative', float: 'right', top: '-3px' }}>
      <div
        style={buttonStyles}
        className="btn btn-default"
      >
        <span style={{ fontSize: '22px' }} title="Submit Workflow">
          <FaPaperPlaneO style={{ cursor: 'pointer' }} onClick={onSubmitWorkflow} />
        </span>
      </div>
      <div
        style={buttonStyles}
        className="btn btn-default"
      >
        <span style={{ fontSize: '22px' }} title="Import Workflow">
          <Dropzone
            onDrop={onDropFile}
            // onClick={() => this.setState({ graphState: graphStates.fetching })}
            multiple={false}
            style={{
              border: 'none',
            }}
          >
            <FaUpload style={{ cursor: 'pointer' }} onClick={() => {}} />
          </Dropzone>
        </span>
      </div>
      <div
        style={buttonStyles}
        className="btn btn-default"
      >
        <span style={{ fontSize: '22px' }} title="Download Workflow">
          <FaDownload style={{ cursor: 'pointer' }} onClick={onDownloadWorkflow} />
        </span>
      </div>
      {/* Delete/ Reset Graph Button */}
      <div
        style={buttonStyles}
        className="btn btn-default"
      >
        <span style={{ fontSize: '22px' }} title="Reset to Blank Graph">
          <FaTrash style={{ cursor: 'pointer' }} onClick={onResetGraph} />
        </span>
      </div>
    </div>
  );
};

const inputHelpPopover = (
  <Popover id="popover-positioned-right" title="Input Builder Help">
    <p>Specify a valid variable name for the output of this block in the <strong>Input</strong> field.</p>
    <p>
      The Curie selector can be used to select the input type from a pre-populated list of concepts.
    Typing text in the search field will attempt to find matches via Bionames. User can always Specify
    a custom Curie by directly typing it into the field - eg: &quot;MONDO:123456&quot;.
    </p>
    <p>A curie must always be selected by clicking the &quot;Select&quot; button for the curie in the search popup box</p>
  </Popover>
);

const flowbokopGraphPopover = (
  <Popover id="popover-positioned-right-2" title="Flowbowkop Graph Overview">
    <p>
      This graph provides an updated view of the Flowbokop workflow graph as it is construted by the user.
    </p>
    <p>
      Each node in the graph can be clicked to display and edit the details for that node in the
      panel below the graph. Changes must be saved by clicking the &#91;<FaFloppyO size={14} /> Save&#93;
      button in the toolbar below the graph.
    </p>
    <p>New Input and Output nodes can be created by clicking the corresponding buttons in the
       toolbar below the graph.
    </p>
    <p>
      The <FaUpload size={14} /> <FaDownload size={14} /> <FaTrash size={14} /> buttons in the title bar
      of the Graph panel can be clicked to import, export or reset the current workflow.
    </p>
  </Popover>
);

const defaultProps = {
  workflowInputs: {}, // workflowInputs can be seeded externally if desired
};

class Flowbokop extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      user: {},
      userReady: false,
      dataReady: false,

      queryGraph: this.getEmptyGraph(),
      graphState: graphStates.empty,
      workflowResult: {},
      panelState: [],

      activePanelInd: 0,
      activePanelState: {},
      activeTab: activeTabKeys.configure,

      inputLabelList: [],
    };

    this.getGraph = this.getGraph.bind(this);
    this.nodeSelectCallback = this.nodeSelectCallback.bind(this);
    this.getPanelIndFromNodeId = this.getPanelIndFromNodeId.bind(this);
    this.onChangeInputLabel = this.onChangeInputLabel.bind(this);
    this.onOperationBuilderChange = this.onOperationBuilderChange.bind(this);
    this.getInputOperationPanel = this.getInputOperationPanel.bind(this);
    this.updatePanelState = this.updatePanelState.bind(this);
    this.saveActivePanel = this.saveActivePanel.bind(this);
    this.deleteActivePanel = this.deleteActivePanel.bind(this);
    this.newActivePanel = this.newActivePanel.bind(this);
    this.onDownloadWorkflow = this.onDownloadWorkflow.bind(this);
    this.onDropFile = this.onDropFile.bind(this);
    this.onResetGraph = this.onResetGraph.bind(this);
    this.revertActivePanel = this.revertActivePanel.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.onDownloadResults = this.onDownloadResults.bind(this);
    this.onSubmitWorkflow = this.onSubmitWorkflow.bind(this);
    // this.onSubmitWorkflow = this.onSubmitWorkflowFake.bind(this);

    // Update internal state
    this.state.panelState = this.workflowInputsToPanelState(props.workflowInputs);
    // Set activePanelState appropriately
    if (this.state.panelState.length >= (this.state.activePanelInd + 1)) {
      this.state.activePanelState = _.cloneDeep(this.state.panelState[this.state.activePanelInd]);
    }
  }

  componentDidMount() {
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
    this.appConfig.concepts(() => {
      this.setState({
        // concepts: data,
        dataReady: true,
      });
    });
    this.updateInputList();
    this.getGraph();
  }

  componentDidUpdate() {
    // Update this.state.activePanelState if the current entry's result differs from the corresponding
    // entry in this.state.panelState (for example when the latter gets updated with results)
    if (this.state.panelState.length >= (this.state.activePanelInd + 1)) {
      // if (!_.isEqual(this.state.activePanelState, this.state.panelState[this.state.activePanelInd])) {
      if (!_.isEqual(this.state.activePanelState.result, this.state.panelState[this.state.activePanelInd].result)) {
        this.setState({ activePanelState: _.cloneDeep(this.state.panelState[this.state.activePanelInd]) });
      }
    }
  }

  /**
   * Convert JSON workflow input format to internal Panel State representation.
   * If any workflow results stored in this.state.workflowResult, then these are
   * merged into the returned panel state objects under the `result` param.
   * @param {JSON Object} workflowInp - Flowbokop Workflow input specification
   * @returns {Array} Array in internal Panel state representation of form:
   * [
   *   {
   *     inputType: 'input',
   *     locked: true,
   *     inputLabel: 'usher2',
   *     result: [],
   *     data: [{'type': 'disease', 'curie': 'MONDO:0016484', 'label': 'Usher syndrome type 2'}],
   *   },
   *   {
   *     inputType: 'operation',
   *     locked: true,
   *     result: [],
   *     data: {
   *       input: 'usher1',
   *       output: 'usher1_genes',
   *       service: 'http://127.0.0.1/api/flowbokop/expand/disease/gene/',
   *       options: '',
   *     },
   *   }
   * ]
   */
  workflowInputsToPanelState(workflowInp) {
    let panelState = [];
    const outputLabels = []; // List of output variable names for each node/panel item
    const workflowInput = _.cloneDeep(workflowInp);
    if (Object.hasOwnProperty.call(workflowInput, 'input')) {
      const inputLabels = Object.keys(workflowInput.input);
      inputLabels.forEach((inputLabel) => {
        const isCurieListArray = Array.isArray(workflowInput.input[inputLabel]);
        // Ensure data is always an array
        panelState.push({
          inputType: 'input',
          isValid: true,
          inputLabel,
          result: [],
          data: isCurieListArray ? workflowInput.input[inputLabel] : [workflowInput.input[inputLabel]],
        });
        outputLabels.push(inputLabel);
      });
    }
    if (Object.hasOwnProperty.call(workflowInput, 'options')) {
      if (Object.hasOwnProperty.call(workflowInput.options, 'operations')) {
        workflowInput.options.operations.forEach((operationData) => {
          let options = '';
          // Always convert input(s) into a list of string(s)
          if (typeof operationData.input === 'string' || operationData.input instanceof String) {
            operationData.input = [operationData.input];
          }
          if (Object.hasOwnProperty.call(operationData, 'options')) {
            if (typeof operationData.options === 'string' || operationData.options instanceof String) {
              // options = { operationData };
              ({ options } = operationData);
            }
          }
          panelState.push({
            inputType: 'operation',
            isValid: true,
            result: [],
            data: Object.assign({}, operationData, { options }),
          });
          outputLabels.push(operationData.output);
        });
      }
    }
    // Merge in `results` value to each panel if this.state.workflowResult is non-empty
    panelState = this.updatePanelStateWithResults(panelState);
    return panelState;
  }

  /**
   * Mutates provided panelState array with updates to the `result` field for each node
   * based on current value of this.state.workflowResult
   * @param {Array} panelState - Panel state array representation (Will be mutated!)
   */
  updatePanelStateWithResults(panelState) {
    if (arguments.length === 0) {
      panelState = _.cloneDeep(this.state.panelState); // eslint-disable-line no-param-reassign
    }
    const outputLabels = []; // output variable names for each node in panelState
    panelState.forEach((panelObj) => {
      if (panelObj.inputType === 'input') {
        outputLabels.push(panelObj.inputLabel);
      }
      if (panelObj.inputType === 'operation') {
        outputLabels.push(panelObj.data.output);
      }
    });
    if (!_.isEmpty(this.state.workflowResult)) {
      const workflowResult = _.cloneDeep(this.state.workflowResult);
      const outputVarNames = Object.keys(workflowResult);
      outputVarNames.forEach((outputVarName) => {
        const outputLabelInd = outputLabels.indexOf(outputVarName);
        // Update panelState array entry with corresponding workflow result curieList
        if (outputLabelInd > -1) {
          panelState[outputLabelInd].result = workflowResult[outputVarName]; // eslint-disable-line no-param-reassign
        }
      });
    } else {
      // Reset the `result` param to [] for all panels if this.state.workflowResult is empty
      panelState.forEach(panelObj => (panelObj.result = [])); // eslint-disable-line
    }
    return panelState;
  }

  /**
   * Returns panelInd from Node id in returned queryGraph from the flowbokop /graph
   * endpoint. If Node-id corresponds to the output node, -1 is returned.
   * @param {Int} id - Id of the node in the queryGraph data structure
   * @returns {Int} panel index corresponding to the node with id: `id`. -1 for output node.
   */
  getPanelIndFromNodeId(id) {
    const nodeOfInterest = this.state.queryGraph.nodes.filter(n => (n.id === id));
    if (nodeOfInterest[0].is_output) {
      return -1;
    }
    const nodeOutputLabel = nodeOfInterest[0].is_input ? nodeOfInterest[0].name : nodeOfInterest[0].operation.output;
    let panelInd;
    this.state.panelState.forEach((panelObj, i) => {
      if (panelObj.inputType === 'input') {
        if (panelObj.inputLabel === nodeOutputLabel) {
          panelInd = i;
        }
      }
      if (panelObj.inputType === 'operation') {
        if (panelObj.data.output === nodeOutputLabel) {
          panelInd = i;
        }
      }
    });
    return panelInd;
  }

  getInputOperationPanel() {
    const { activePanelState } = this.state;
    if (_.isEmpty(activePanelState)) {
      return null;
    }
    const panelObj = _.cloneDeep(activePanelState);
    const { inputType } = panelObj;
    if (inputType === 'input') {
      const onCurieListChange = ({ curieList, inputLabel, isValid }) => {
        panelObj.data = curieList;
        panelObj.inputLabel = inputLabel;
        panelObj.isValid = isValid;
        this.updatePanelState(panelObj);
      };
      return (
        <Panel style={{ marginBottom: '5px' }}>
          <Panel.Heading>
            <Panel.Title>
              Input - {`${panelObj.inputLabel} `}
              <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={inputHelpPopover}>
                <FaInfoCircle size={12} />
              </OverlayTrigger>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <FlowbokopInputBuilder
              config={this.props.config}
              onChangeHook={onCurieListChange}
              panelObj={panelObj}
              // inputCurieList={panelObj.data}
              // inputLabel={panelObj.inputLabel}
              // onChangeLabel={e => this.onChangeInputLabel(e.target.value)}
            />
          </Panel.Body>
        </Panel>
      );
    }
    return (
      <Panel style={{ marginBottom: '5px' }}>
        <Panel.Heading>
          <Panel.Title>
            {`Operation [ ${panelObj.data.input} → ${panelObj.data.output} ]`}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <FlowbokopOperationBuilder
            onChangeHook={this.onOperationBuilderChange}
            onInputSelect={this.onOperationPanelInputSelect}
            panelObj={panelObj}
            inputLabelList={this.state.inputLabelList}
          />
        </Panel.Body>
      </Panel>
    );
  }

  updatePanelState(newPanelObj) {
    this.setState({ activePanelState: _.cloneDeep(newPanelObj) });
  }

  saveActivePanel() {
    const panelState = _.cloneDeep(this.state.panelState);
    const activePanelState = _.cloneDeep(this.state.activePanelState);
    const { activePanelInd } = this.state;
    // Set list of input labels to JSON array instead of a string
    if (Object.hasOwnProperty.call(activePanelState.data, 'input')) {
      if (activePanelState.data.input.includes('[')) {
        activePanelState.data.input = JSON.parse(activePanelState.data.input);
      }
    }
    if (activePanelInd < panelState.length) {
      // Check if "output" name for block changed and rename
      // the matching input in all other blocks (only if editing existing block)
      let outputLabelSelector;
      if (activePanelState.inputType === 'input') {
        outputLabelSelector = x => x.inputLabel;
      }
      if (activePanelState.inputType === 'operation') {
        outputLabelSelector = x => x.data.output;
      }
      const newOutputLabel = outputLabelSelector(activePanelState);
      const oldOutputLabel = outputLabelSelector(panelState[activePanelInd]);
      if (newOutputLabel !== oldOutputLabel) {
        // Rename input term in all other operation blocks that references renamed output
        panelState.forEach((panelObj) => {
          if (panelObj.data.input) {
            // Handle when input is a simple string of a single input variable
            if (typeof panelObj.data.input === 'string' || panelObj.data.input instanceof String) {
              if (panelObj.data.input === oldOutputLabel) {
                panelObj.data.input = newOutputLabel;
              }
            }
            // Handle when input is a list of input variables
            if (Array.isArray(panelObj.data.input)) {
              const oldLabelInd = panelObj.data.input.indexOf(oldOutputLabel);
              if (oldLabelInd >= 0) {
                panelObj.data.input[oldLabelInd] = newOutputLabel;
              }
            }
          }
        });
      }
    }
    panelState[this.state.activePanelInd] = activePanelState;
    this.updateInputList(panelState);
    this.setState({ panelState }, this.getGraph);
  }

  deleteActivePanel() {
    const panelState = _.cloneDeep(this.state.panelState);
    let activePanelState = _.cloneDeep(this.state.activePanelState);
    let { activePanelInd } = this.state;
    // Handle if deleting an existing node in graph
    if (activePanelInd < panelState.length) {
      panelState.splice(activePanelInd, 1); // Delete the panel
      activePanelInd = activePanelInd > 0 ? activePanelInd - 1 : 0;
      if (panelState.length >= activePanelInd + 1) {
        activePanelState = _.cloneDeep(panelState[activePanelInd]);
      } else {
        activePanelState = {};
      }
    } else {
      // Handle when deleting new node panel (that was not patched into panelState)
      activePanelInd = 0;
      activePanelState = panelState.length > 0 ? _.cloneDeep(panelState[activePanelInd]) : {};
    }
    this.updateInputList(panelState);
    this.setState({ activePanelInd, activePanelState, panelState }, this.getGraph);
  }

  // Revert any unsaved changes in a panel for an existing node
  revertActivePanel() {
    const panelState = _.cloneDeep(this.state.panelState);
    // let activePanelState = _.cloneDeep(this.state.activePanelState);
    const { activePanelInd } = this.state;
    this.setState({ activePanelState: panelState[activePanelInd] });
  }

  newActivePanel(panelType) {
    const activePanelInd = this.state.panelState.length;
    const activePanelState = (panelType.toLowerCase() === 'input') ? this.defaultInputPanelState() : this.defaultOperationPanelState();
    this.setState({ activePanelInd, activePanelState });
  }

  defaultInputPanelState() {
    return (
      {
        inputType: 'input',
        isValid: false,
        inputLabel: '',
        data: [{ type: 'disease', curie: '', label: '' }],
      }
    );
  }

  defaultOperationPanelState() {
    return (
      {
        inputType: 'operation',
        isValid: false,
        data: {
          input: [],
          output: '',
          label: '',
          service: '',
          options: '',
        },
      }
    );
  }

  onChangeInputLabel(newLabel) {
    const activePanelState = _.cloneDeep(this.state.activePanelState);
    activePanelState.inputLabel = newLabel;
    this.setState({ activePanelState });
  }

  onOperationBuilderChange(operationDataObj) {
    // console.log('onOperationBuilderChange:', operationDataObj);
    const {
      input, output, label, service, options, isValid,
    } = operationDataObj;
    const activePanelState = _.cloneDeep(this.state.activePanelState);
    activePanelState.data = {
      input, output, label, service, options,
    };
    activePanelState.isValid = isValid;
    this.setState({ activePanelState });
  }

  nodeSelectCallback(data) {
    let nodeId = -1;
    if (data.nodes.length > 0) {
      nodeId = data.nodes[0]; // eslint-disable-line prefer-destructuring
    }
    const panelInd = this.getPanelIndFromNodeId(nodeId);
    // Don't change UI state if Output node is clicked
    if (panelInd > -1) {
      this.setState({ activePanelInd: panelInd, activePanelState: this.state.panelState[panelInd] });
    }
  }

  // Handle clicks on Configure/Results tab
  onChangeTab(key) {
    this.setState({ activeTab: key });
  }

  getEmptyGraph() {
    // return demoGraph;
    return {
      nodes: [],
      edges: [],
    };
  }

  /**
   * Fetch query graph from Flowbokop /graph endpoint in async manner
   * and display status accordingly in UI. Any existing results will
   * be invalidated and deleted.
   */
  getGraph() {
    console.log('Input to graph endpoint:', panelStateToWorkflowInputs(this.state.panelState));
    // Don't query /graph endpoint if we don't have any data
    if (_.isEmpty(this.state.panelState)) {
      this.setState({ graphState: graphStates.empty });
      return;
    }
    this.setState({ graphState: graphStates.fetching }, () => {
      this.appConfig.flowbokopGraph(
        panelStateToWorkflowInputs(this.state.panelState),
        (data) => {
          const validGraph = this.isValidGraph(data);
          const graphState = validGraph ? graphStates.display : graphStates.empty;
          this.setState({
            queryGraph: data,
            graphState,
            workflowResult: {},
            activeTab: activeTabKeys.configure,
          }, () => this.setState({ panelState: this.updatePanelStateWithResults() }));
        },
        err => console.log('Error fetching query graph', err),
      );
    });
  }

  isValidGraph(graph) {
    return 'nodes' in graph && Array.isArray(graph.nodes) && graph.nodes.length > 0;
  }

  onDownloadResults() {
    const results = this.state.workflowResult;

    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(results, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // This doesn't use Blob() might also work
    // var url = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'flowbokopWorkflowResults.json';
    a.href = url;
    a.click();
    a.remove();
  }

  onDownloadWorkflow() {
    const data = panelStateToWorkflowInputs(this.state.panelState);

    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // This doesn't use Blob() might also work
    // var url = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'flowbokopWorkflow.json';
    a.href = url;
    a.click();
    a.remove();
  }

  onDropFile(acceptedFiles, rejectedFiles) {
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => this.setState({ graphState: graphStates.fetching });
      // fr.onloadend = () => this.setState({ graphState: graphStates.fetching });
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const fileContentObj = JSON.parse(fileContents);
          const panelState = this.workflowInputsToPanelState(fileContentObj);
          const activePanelState = panelState.length > 0 ? panelState[0] : {};
          const activePanelInd = 0;
          this.updateInputList(panelState);
          this.setState({ panelState, activePanelInd, activePanelState }, this.getGraph);
        } catch (err) {
          console.log(err);
          window.alert('Failed to read this workflow template. Are you sure this is valid?');
          this.setState({ graphState: graphStates.empty });
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file. The file may be invalid JSON.');
        this.setState({ graphState: graphStates.empty });
      };
      fr.readAsText(file);
    });
  }

  onSubmitWorkflow() {
    this.setState({ graphState: graphStates.fetching }, () => {
      this.appConfig.flowbokopExecute(
        panelStateToWorkflowInputs(this.state.panelState),
        (data) => {
          // const validGraph = this.isValidGraph(data);
          // const graphState = validGraph ? graphStates.display : graphStates.empty;
          console.log('Flowbokop Execute output:', data);
          this.setState({
            graphState: graphStates.display,
            workflowResult: data,
          }, () => this.setState({ panelState: this.updatePanelStateWithResults(), activeTab: activeTabKeys.results }));
        },
        err => console.log('Error fetching query graph', err),
      );
    });
  }

  // TODO: Delete - Test function for no-internet situations
  onSubmitWorkflowFake() {
    this.setState({ graphState: graphStates.fetching }, () => {
      const fakeWorkflowResult = {
        "usher1": [
          {
            "curie": "MONDO:0010168",
            "label": "Usher syndrome type 1"
          }
        ],
        "usher2": [
          {
            "curie": "MONDO:0016484",
            "label": "Usher syndrome type 2"
          }
        ],
        "usher1_genes": [
          {
            "label": "FBXO9",
            "curie": "HGNC:13588"
          },
          {
            "label": "CDH17",
            "curie": "HGNC:1756"
          },
          {
            "label": "WDR91",
            "curie": "HGNC:24997"
          },
          {
            "label": "CIB4",
            "curie": "HGNC:33703"
          },
          {
            "label": "TAF9B",
            "curie": "HGNC:17306"
          },
          {
            "label": "AGBL5",
            "curie": "HGNC:26147"
          },
          {
            "label": "ADGRV1",
            "curie": "HGNC:17416"
          },
          {
            "label": "USH2A",
            "curie": "HGNC:12601"
          },
          {
            "label": "LRRC18",
            "curie": "HGNC:23199"
          },
          {
            "label": "ASZ1",
            "curie": "HGNC:1350"
          },
          {
            "label": "WDR81",
            "curie": "HGNC:26600"
          },
          {
            "label": "MYO7A",
            "curie": "HGNC:7606"
          },
          {
            "label": "JMY",
            "curie": "HGNC:28916"
          }
        ],
        "usher2_genes": [
          {
            "label": "WHRN",
            "curie": "HGNC:16361"
          },
          {
            "label": "ADGRV1",
            "curie": "HGNC:17416"
          },
          {
            "label": "USH2A",
            "curie": "HGNC:12601"
          },
          {
            "label": "PDZD7",
            "curie": "HGNC:26257"
          },
          {
            "label": "MYO7A",
            "curie": "HGNC:7606"
          }
        ],
        "common_genes": [
          {
            "label": "ADGRV1",
            "curie": "HGNC:17416"
          },
          {
            "label": "USH2A",
            "curie": "HGNC:12601"
          },
          {
            "label": "MYO7A",
            "curie": "HGNC:7606"
          }
        ]
      };
      setTimeout(() => {
        console.log('Flowbokop FAKE Execute output:', fakeWorkflowResult);
        this.setState({
          graphState: graphStates.display,
          workflowResult: fakeWorkflowResult,
        }, () => this.setState({
          panelState: this.updatePanelStateWithResults(),
          activeTab: activeTabKeys.results,
        }));
      }, 5000);
    });
  }

  onResetGraph() {
    this.setState({
      queryGraph: this.getEmptyGraph(),
      activePanelState: {},
      activePanelInd: 0,
      graphState: graphStates.empty,
      panelState: [],
      inputLabelList: [],
      workflowResult: {},
      activeTab: activeTabKeys.configure,
    });
  }

  // Report if current panel has unsaved changes
  isUnsavedChanges() {
    const { activePanelState, activePanelInd, panelState } = this.state;
    if (panelState.length === 0) {
      if (!_.isEmpty(activePanelState)) {
        return true;
      }
      return false;
    }
    if (_.isEqual(activePanelState, panelState[activePanelInd])) {
      return false;
    }
    return true;
  }

  updateInputList(panelSt) {
    if (arguments.length === 0) {
      panelSt = this.state.panelState; // eslint-disable-line no-param-reassign
    }
    let inputList = [];
    const panelState = _.cloneDeep(panelSt);
    panelState.forEach((panelObj) => {
      const input = panelObj.inputType === 'input' ? panelObj.inputLabel : panelObj.data.output;
      inputList.push(input);
    });
    inputList = Array.from(new Set(inputList)).sort();
    this.setState({ inputLabelList: inputList });
  }

  // // Callback sent to MultiSelect component for input list specification in OperationBuilder
  // onOperationPanelInputSelect(value) {
  //   const activePanelState = _.cloneDeep(this.state.activePanelState);
  //   activePanelState.data.output = value;
  //   this.setState({ activePanelState });
  // }

  renderLoading() {
    return (
      <Loading />
    );
  }

  renderLoaded() {
    const unsavedChanges = this.isUnsavedChanges();
    const { isValid: isValidPanel } = this.state.activePanelState;
    const atleastOneInput = this.state.panelState.some(panelObj => panelObj.inputType === 'input');
    const isNewPanel = this.state.activePanelInd === this.state.panelState.length;
    const hasResults = !isNewPanel && this.state.activePanelState.result && this.state.activePanelState.result.length > 0;
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          <Row>
            <Col md={12}>
              <Panel>
                <Panel.Heading>
                  <Panel.Title>
                    {'Flowbokop Operation Graph '}
                    <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={flowbokopGraphPopover}>
                      <FaInfoCircle size={12} />
                    </OverlayTrigger>
                    <GraphTitleButtons
                      onDownloadWorkflow={this.onDownloadWorkflow}
                      onDropFile={this.onDropFile}
                      onResetGraph={this.onResetGraph}
                      onSubmitWorkflow={this.onSubmitWorkflow}
                    />
                  </Panel.Title>
                </Panel.Heading>
                <Panel.Body style={{ padding: '0px' }}>
                  <FlowbokopGraphFetchAndView
                    graph={this.state.queryGraph}
                    graphState={this.state.graphState}
                    height="350px"
                    nodeSelectCallback={this.nodeSelectCallback}
                    // width={700}
                  />
                </Panel.Body>
              </Panel>
              <Tabs
                activeKey={this.state.activeTab}
                onSelect={this.onChangeTab}
                id="node-display-tabs"
              >
                <Tab eventKey={activeTabKeys.configure} title="Configure">
                  <div style={{ marginTop: '10px', marginBottom: '6px' }}>
                    <ButtonGroup>
                      {!_.isEmpty(this.state.activePanelState) &&
                        <Button
                          onClick={this.saveActivePanel}
                          disabled={!unsavedChanges || !isValidPanel}
                          bsStyle={isValidPanel ? (unsavedChanges ? 'primary' : 'default') : 'danger'} // eslint-disable-line no-nested-ternary
                          title={isValidPanel ? (unsavedChanges ? 'Save changes' : 'No changes to save') : 'Fix invalid panel entries first'} // eslint-disable-line no-nested-ternary
                        >
                          <FaFloppyO style={{ verticalAlign: 'text-top' }} />
                          {' Save'}
                        </Button>
                      }
                      {!isNewPanel &&
                        <Button
                          onClick={this.revertActivePanel}
                          disabled={!unsavedChanges}
                          title={unsavedChanges ? 'Undo unsaved changes' : 'No changes to undo'}
                        >
                          <FaUndo style={{ verticalAlign: 'text-top' }} />
                          {' Undo'}
                        </Button>
                      }
                      {(this.state.panelState.length > 1) &&
                        <Button onClick={this.deleteActivePanel} title={`${isNewPanel ? 'Discard' : 'Delete'} current node`}>
                          <FaTrash style={{ verticalAlign: 'text-top' }} />{` ${isNewPanel ? 'Discard' : 'Delete'}`}
                        </Button>
                      }
                      <Button onClick={() => this.newActivePanel('input')}>
                        <FaPlus style={{ verticalAlign: 'text-top' }} />{' New Input'}
                      </Button>
                      {atleastOneInput &&
                        <Button onClick={() => this.newActivePanel('operation')}>
                          <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' New Operation'}
                        </Button>
                      }
                    </ButtonGroup>
                  </div>
                  {this.getInputOperationPanel()}
                </Tab>
                <Tab eventKey={activeTabKeys.results} title="Results" disabled={!hasResults}>
                  {hasResults &&
                    <div>
                      <div style={{ marginTop: '10px', marginBottom: '6px' }}>
                        <ButtonGroup>
                          {!_.isEmpty(this.state.activePanelState) &&
                            <Button
                              onClick={this.onDownloadResults}
                              bsStyle="primary"
                              title="Export Flowbokop workflow results as JSON file"
                            >
                              <FaDownload style={{ verticalAlign: 'text-top' }} />
                              {' Export all results'}
                            </Button>
                          }
                        </ButtonGroup>
                      </div>
                      <CurieBrowser
                        curieList={this.state.activePanelState.result}
                        defaults={{ type: '', label: '<N/A>' }}
                      />
                    </div>
                  }
                </Tab>
              </Tabs>
              {/* </PanelGroup> */}
            </Col>
          </Row>
        </Grid>
        <Footer config={this.props.config} />
      </div>
    );
  }

  render() {
    const ready = this.state.dataReady && this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

Flowbokop.defaultProps = defaultProps;

export default Flowbokop;
