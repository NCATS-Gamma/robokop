import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Row, Col, Button, ButtonGroup, PanelGroup, Panel } from 'react-bootstrap';
import FaFloppyO from 'react-icons/lib/fa/floppy-o';
import FaTrash from 'react-icons/lib/fa/trash';
import FaPlus from 'react-icons/lib/fa/plus';
import FaPlusSquare from 'react-icons/lib/fa/plus-square';
import FaDownload from 'react-icons/lib/fa/download';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import FlowbokopGraphFetchAndView, { graphStates } from './components/flowbokop/FlowbokopGraphFetchAndView';
import FlowbokopInputBuilder from './components/flowbokop/FlowbokopInputBuilder';
import FlowbokopOperationBuilder from './components/flowbokop/FlowbokopOperationBuilder';


const _ = require('lodash');

const demoGraph = {
  "nodes": [
    {
      "id": 0,
      "name": "usher1",
      "operation": {}
    },
    {
      "id": 1,
      "name": "usher2",
      "operation": {}
    },
    {
      "id": 2,
      "name": "usher1_genes",
      "operation": {
        "service": "http://127.0.0.1/api/flowbokop/expand/disease/gene/",
        "options": null
      }
    },
    {
      "id": 3,
      "name": "usher2_genes",
      "operation": {
        "service": "http://127.0.0.1/api/flowbokop/expand/disease/gene/",
        "options": null
      }
    },
    {
      "id": 4,
      "name": "common_genes",
      "operation": {
        "service": "http://127.0.0.1/api/flowbokop/intersection/",
        "options": null
      }
    }
  ],
  "edges": [
    {
      "source_id": 0,
      "target_id": 2
    },
    {
      "source_id": 1,
      "target_id": 3
    },
    {
      "source_id": 2,
      "target_id": 4
    },
    {
      "source_id": 3,
      "target_id": 4
    }
  ]
};

const demoPanelState = [
  { 
    inputType: 'input',
    locked: true,
    inputLabel: 'usher1',
    data: [{'type': 'disease', 'curie': 'MONDO:0010168', 'label': 'Usher syndrome type 1'}],
  },
  { 
    inputType: 'input',
    locked: true,
    inputLabel: 'usher2',
    data: [{'type': 'disease', 'curie': 'MONDO:0016484', 'label': 'Usher syndrome type 2'}],
  },
  { 
    inputType: 'operation',
    locked: true,
    data: {
      input: 'usher1',
      output: 'usher1_genes',
      service: 'http://127.0.0.1/api/flowbokop/expand/disease/gene/',
      options: '',
    },
  },
  { 
    inputType: 'operation',
    locked: true,
    data: {
      input: 'usher2',
      output: 'usher2_genes',
      service: 'http://127.0.0.1/api/flowbokop/expand/disease/gene/',
      options: '',
    },
  },
  { 
    inputType: 'operation',
    locked: true,
    data: {
      input: ['usher1_genes', 'usher2_genes'],
      output: 'common_genes',
      service: 'http://127.0.0.1/api/flowbokop/intersection/',
      options: '',
    },
  },
];

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

// Convert WorkflowInput representation for Flowbokop into internal panel state
// representation
const workflowInputsToPanelState = (workflowInput) => {
  const panelState = [];
  if (Object.hasOwnProperty.call(workflowInput, 'input')) {
    const inputLabels = Object.keys(workflowInput.input);
    inputLabels.forEach((inputLabel) => {
      panelState.push({
        inputType: 'input',
        locked: true,
        inputLabel,
        data: workflowInput.input[inputLabel],
      });
    });
  }
  if (Object.hasOwnProperty.call(workflowInput, 'options')) {
    if (Object.hasOwnProperty.call(workflowInput.options, 'operations')) {
      workflowInput.options.operations.forEach((operationData) => {
        let options = '';
        if (Object.hasOwnProperty.call(operationData, 'options')) {
          if (typeof operationData.options === 'string' || operationData.options instanceof String) {
            options = { operationData };
          }
        }
        panelState.push({
          inputType: 'operation',
          locked: true,
          data: Object.assign({}, operationData, { options }),
        });
      });
    }
  }
  return panelState;
};

const demoWorkflowInputs = {
  'input': {
      'usher1': {'type': 'disease', 'curie': 'MONDO:0010168', 'label': 'Usher syndrome type 1'},
      'usher2': {'type': 'disease', 'curie': 'MONDO:0016484', 'label': 'Usher syndrome type 2'},
  },
  'options': {
      'output': 'all',
      'operations': [
          {
              'input': 'usher1',
              'output': 'usher1_genes',
              'label': 'Expand',
              'service': 'http://127.0.0.1/api/flowbokop/expand/disease/gene/'
          },
          {
              'input': 'usher2',
              'output': 'usher2_genes',
              'label': 'Expand',
              'service': 'http://127.0.0.1/api/flowbokop/expand/disease/gene/'
          },
          {
              'input': ['usher1_genes', 'usher2_genes'],
              'output': 'common_genes',
              'label': 'Intersect',
              'service': 'http://127.0.0.1/api/flowbokop/intersection/'
          },
      ]
  }
};

const defaultProps = {
  workflowInputs: demoWorkflowInputs, // workflowInputs can be seeded externally if desired
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
      graphState: graphStates.fetching,
      panelState: workflowInputsToPanelState(props.workflowInputs),

      activePanelInd: 0,
      activePanelState: {},
    };

    // Set activePanelState appropriately
    if (this.state.panelState.length >= (this.state.activePanelInd + 1)) {
      this.state.activePanelState = _.cloneDeep(this.state.panelState[this.state.activePanelInd]);
    }

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
    this.getGraph();
  }

  getPanelIndFromNodeId(id) {
    const nodeOfInterest = this.state.queryGraph.nodes.filter((n) => {
      return n.id === id;
    });
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

  getInputOperationPanels() {
    // Return array of Panel elements based on this.state.panelState
    const { panelState } = this.state;
    const panels = panelState.map((panelObj, i) => {
      const { inputType } = panelObj;
      if (inputType === 'input') {
        return (
          <Panel>
            <Panel.Heading>
              <Panel.Title>
                Input - {`${panelObj.inputLabel}`}
              </Panel.Title>
            </Panel.Heading>
            <Panel.Body>
              <FlowbokopInputBuilder
                config={this.props.config}
                onChangeHook={inputCurieList => console.log(inputCurieList)}
                inputCurieList={panelObj.data}
                inputLabel={panelObj.inputLabel}
                onChangeLabel={e => (panelObj.inputLabel = e.target.value)}
              />
              {/* {JSON.stringify(this.props.label, null , 2)}
              {JSON.stringify(this.props.data, null , 2)} */}
            </Panel.Body>
          </Panel>
        );
        // return <FlowbokopInputPanel data={panelObj.data} lock={panelObj.locked} label={panelObj.inputLabel} key={i} />;
      }
      return <FlowbokopOperationPanel data={panelObj.data} lock={panelObj.locked} key={i} />;
    });
    return panels;
  }

  getInputOperationPanel() {
    const { activePanelState, activePanelInd } = this.state;
    if (_.isEmpty(activePanelState)) {
      return null;
    }
    const panelObj = _.cloneDeep(activePanelState);
    const { inputType } = panelObj;
    if (inputType === 'input') {
      const onCurieListChange = (inputCurieList) => {
        panelObj.data = inputCurieList;
        this.updatePanelState(panelObj, activePanelInd);
      };
      return (
        <Panel style={{ marginBottom: '5px' }}>
          <Panel.Heading>
            <Panel.Title>
              Input - {`${panelObj.inputLabel}`}
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <FlowbokopInputBuilder
              config={this.props.config}
              onChangeHook={onCurieListChange}
              inputCurieList={panelObj.data}
              inputLabel={panelObj.inputLabel}
              onChangeLabel={e => this.onChangeInputLabel(e.target.value)}
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
            panelObj={panelObj}
          />
        </Panel.Body>
      </Panel>
    );
    // return <FlowbokopOperationPanel data={panelObj.data} lock={panelObj.locked} />;
  }

  updatePanelState(newPanelObj, ind) {
    // const panelState = _.cloneDeep(this.state.panelState);
    // panelState[ind] = _.cloneDeep(newPanelObj);
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
    this.setState({ activePanelInd, activePanelState, panelState }, this.getGraph);
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
        locked: true,
        inputLabel: '',
        data: [{ type: 'disease', curie: '', label: '' }],
      }
    );
  }

  defaultOperationPanelState() {
    return (
      {
        inputType: 'operation',
        locked: true,
        data: {
          input: '',
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
    const activePanelState = _.cloneDeep(this.state.activePanelState);
    activePanelState.data = operationDataObj;
    this.setState({ activePanelState });
  }

  nodeSelectCallback(data) {
    let nodeId = -1;
    if (data.nodes.length > 0) {
      nodeId = data.nodes[0];
    }
    const panelInd = this.getPanelIndFromNodeId(nodeId);
    this.setState({ activePanelInd: panelInd, activePanelState: this.state.panelState[panelInd] });
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
   * and display status accordingly in UI
   */
  getGraph() {
    console.log('Input to graph endpoint:', panelStateToWorkflowInputs(this.state.panelState));
    this.setState({ graphState: graphStates.fetching }, () => {
      this.appConfig.flowbokopGraph(
        panelStateToWorkflowInputs(this.state.panelState),
        (data) => {
          const validGraph = this.isValidGraph(data);
          const graphState = validGraph ? graphStates.display : graphStates.empty;
          this.setState({ queryGraph: data, graphState });
        },
        err => console.log('Error fetching query graph', err),
      );
    });
  }

  isValidGraph(graph) {
    return 'nodes' in graph && Array.isArray(graph.nodes) && graph.nodes.length > 0;
  }

  renderLoading() {
    return (
      <Loading />
    );
  }

  renderLoaded() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          <Row>
            <Col md={12}>
              <FlowbokopGraphFetchAndView
                graph={this.state.queryGraph}
                graphState={this.state.graphState}
                height="350px"
                nodeSelectCallback={this.nodeSelectCallback}
                // width={700}
              />
              {/* <PanelGroup
                accordion={false}
                id="workflow-accordion"
                // activeKey={this.state.activeKey}
                // onSelect={this.handleSelect}
              > */}
              {this.getInputOperationPanel()}
              {/* </PanelGroup> */}
              <div style={{ marginTop: '0px', marginBottom: '10px' }}>
                <ButtonGroup>
                  <Button onClick={this.saveActivePanel}>
                    <FaFloppyO style={{ verticalAlign: 'text-top' }} />
                    {' Save'}
                  </Button>
                  {(this.state.panelState.length > 1) &&
                    <Button onClick={this.deleteActivePanel}>
                      <FaTrash style={{ verticalAlign: 'text-top' }} />{' Delete'}
                    </Button>
                  }
                  <Button onClick={() => this.newActivePanel('input')}>
                    <FaPlus style={{ verticalAlign: 'text-top' }} />{' New Input'}
                  </Button>
                  <Button onClick={() => this.newActivePanel('operation')}>
                    <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' New Operation'}
                  </Button>
                  <Button>
                    <FaDownload style={{ verticalAlign: 'text-top' }} />{' Export Query JSON'}
                  </Button>
                </ButtonGroup>
              </div>
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


class FlowbokopOperationPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title>
            Operation
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          {this.props.data.output}
          {JSON.stringify(this.props.data, null , 2)}
        </Panel.Body>
      </Panel>
    );
  }
}


export default Flowbokop;
