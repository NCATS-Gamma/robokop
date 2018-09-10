import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Row, Col, Button, PanelGroup, Panel } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import FlowbokopGraphFetchAndView, { graphStates } from './components/flowbokop/FlowbokopGraphFetchAndView';


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
      service: 'http://127.0.0.1/api/flowbokop/expand/disease/gene/'
    },
  },
  { 
    inputType: 'operation',
    locked: true,
    data: {
      input: 'usher2',
      output: 'usher2_genes',
      service: 'http://127.0.0.1/api/flowbokop/expand/disease/gene/'
    },
  },
  { 
    inputType: 'operation',
    locked: true,
    data: {
      input: ['usher1_genes', 'usher2_genes'],
      output: 'common_genes',
      service: 'http://127.0.0.1/api/flowbokop/intersection/'
    },
  },
];

// Convert internal panel state representation to Flowbokop workflow input
// representation that is required to be POSTed to the Flowbokop endpoint
const panelStateToWorkflowInputs = (panelState) => {
  const workflowInputs = { input: {}, options: { output: 'all', operations: [] } };
  panelState.forEach((panelData) => {
    if (panelData.inputType === 'input') {
      workflowInputs.input[panelData.inputLabel] = panelData.data;
    }
    if (panelData.inputType === 'operation') {
      workflowInputs.options.operations.push(panelData.data);
    }
  })
  return workflowInputs;
}

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
      })
    });
  }
  if (Object.hasOwnProperty.call(workflowInput, 'options')) {
    if (Object.hasOwnProperty.call(workflowInput.options, 'operations')) {
      workflowInput.options.operations.forEach((operationData) => {
        panelState.push({
          inputType: 'operation',
          locked: true,
          data: operationData,
        })
      })
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
              'service': 'http://127.0.0.1/api/flowbokop/expand/disease/gene/'
          },
          {
              'input': 'usher2',
              'output': 'usher2_genes',
              'service': 'http://127.0.0.1/api/flowbokop/expand/disease/gene/'
          },
          {
              'input': ['usher1_genes', 'usher2_genes'],
              'output': 'common_genes',
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
    };

    this.getGraph = this.getGraph.bind(this);
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

  /**
   * Fetch query graph from Flowbokop /graph endpoint in async manner
   * and display status accordingly in UI
   */
  getGraph() {
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

  getEmptyGraph() {
    // return demoGraph;
    return {
      nodes: [],
      edges: [],
    };
  }

  getInputOperationPanels() {
    // Return array of Panel elements based on this.state.panelState
    const { panelState } = this.state;
    const panels = panelState.map((panelObj, i) => {
      const { inputType } = panelObj;
      if (inputType === 'input') {
        return <FlowbokopInputPanel data={panelObj.data} lock={panelObj.locked} label={panelObj.inputLabel} key={i} />;
      }
      return <FlowbokopOperationPanel data={panelObj.data} lock={panelObj.locked} key={i} />;
    });
    return panels;
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
                // width={700}
              />
              <PanelGroup
                accordion={false}
                id="workflow-accordion"
                // activeKey={this.state.activeKey}
                // onSelect={this.handleSelect}
              >
                {this.getInputOperationPanels()}
              </PanelGroup>
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

class FlowbokopInputPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title>
            Input
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          {JSON.stringify(this.props.label, null , 2)}
          {JSON.stringify(this.props.data, null , 2)}
        </Panel.Body>
      </Panel>
    );
  }
}

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
