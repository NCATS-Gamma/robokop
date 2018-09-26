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
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import FlowbokopGraphFetchAndView, { graphStates } from './components/flowbokop/FlowbokopGraphFetchAndView';
import FlowbokopInputBuilder from './components/flowbokop/FlowbokopInputBuilder';
import FlowbokopOperationBuilder from './components/flowbokop/FlowbokopOperationBuilder';
import CurieBrowser from './components/shared/CurieBrowser';
import { activeTabKeys, panelTypes } from './stores/flowbokopStore';

const isEmpty = require('lodash/isEmpty');

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

@inject(({ store }) => ({ store }))
@observer
class Flowbokop extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      user: {},
      userReady: false,
    };

    this.nodeSelectCallback = this.nodeSelectCallback.bind(this);
    this.getInputOperationPanel = this.getInputOperationPanel.bind(this);
    this.onDownloadWorkflow = this.onDownloadWorkflow.bind(this);
    this.onDropFile = this.onDropFile.bind(this);
    this.onResetGraph = this.onResetGraph.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.onDownloadResults = this.onDownloadResults.bind(this);
    this.onSubmitWorkflow = this.onSubmitWorkflow.bind(this);
  }

  componentDidMount() {
    console.log('Mobx Store:', this.props.store);
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
  }

  getInputOperationPanel() {
    const { activePanelState } = this.props.store;
    if (isEmpty(activePanelState)) {
      return null;
    }
    if (activePanelState.inputType === panelTypes.input) {
      return (
        <Panel style={{ marginBottom: '5px' }}>
          <Panel.Heading>
            <Panel.Title>
              Input - {`${activePanelState.inputLabel} `}
              <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={inputHelpPopover}>
                <FaInfoCircle size={12} />
              </OverlayTrigger>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <FlowbokopInputBuilder
              activePanel={activePanelState}
            />
          </Panel.Body>
        </Panel>
      );
    }
    return (
      <Panel style={{ marginBottom: '5px' }}>
        <Panel.Heading>
          <Panel.Title>
            {`Operation [ ${activePanelState.data.input} → ${activePanelState.data.output} ]`}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <FlowbokopOperationBuilder
            activePanel={activePanelState}
            inputLabelList={this.props.store.outputVarNameList}
          />
        </Panel.Body>
      </Panel>
    );
  }

  nodeSelectCallback(data) {
    let nodeId = -1;
    if (data.nodes.length > 0) {
      nodeId = data.nodes[0]; // eslint-disable-line prefer-destructuring
    }
    if (nodeId > -1) {
      this.props.store.updateActivePanelFromNodeId(nodeId);
    }
  }

  // Handle clicks on Configure/Results tab
  onChangeTab(key) {
    this.props.store.onChangeTab(key);
  }

  /**
   * Converts provided JSON serializable data into a .json file that is downloaded
   * to the user's machine via file-save dialog
   * @param {JSON serializable object} data - JSON data to be provided as download
   * @param {*} filename - Default filename for the provided .json file
   */
  provideJsonDownload(data, filename) {
    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = filename;
    a.href = url;
    a.click();
    a.remove();
  }

  onDownloadResults() {
    const results = this.props.store.workflowResult;
    this.provideJsonDownload(results, 'flowbokopWorkflowResults.json');
  }

  onDownloadWorkflow() {
    const data = this.props.store.panelStateToWorkflowInputs();
    this.provideJsonDownload(data, 'flowbokopWorkflow.json');
  }

  onDropFile(acceptedFiles, rejectedFiles) { // eslint-disable-line no-unused-vars
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => this.props.store.setGraphState(graphStates.fetching);
      // fr.onloadend = () => this.setState({ graphState: graphStates.fetching });
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const fileContentObj = JSON.parse(fileContents);
          this.props.store.workflowInputsToPanelState(fileContentObj);
        } catch (err) {
          console.error(err);
          window.alert('Failed to read this workflow template. Are you sure this is valid?');
          this.props.store.setGraphState(graphStates.error);
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file. The file may be invalid JSON.');
        this.props.store.setGraphState(graphStates.error);
      };
      fr.readAsText(file);
    });
  }

  onSubmitWorkflow() {
    this.props.store.onSubmitWorkflow();
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
    this.props.store.resetGraph();
  }

  renderLoading() {
    return (
      <Loading />
    );
  }

  renderLoaded() {
    const { store } = this.props;
    const unsavedChanges = store.isUnsavedChanges;
    const { isValid: isValidPanel } = store.activePanelState;
    const atleastOneInput = store.panelState.some(panelObj => panelObj.inputType === panelTypes.input);
    const isNewPanel = store.activePanelInd === store.panelState.length;
    const hasResults = !isNewPanel && store.activePanelState.hasResult;
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
                    graph={toJS(store.queryGraph)}
                    graphState={store.graphState}
                    height="350px"
                    nodeSelectCallback={this.nodeSelectCallback}
                    // width={700}
                  />
                </Panel.Body>
              </Panel>
              <Tabs
                activeKey={store.activeTab}
                onSelect={this.onChangeTab}
                id="node-display-tabs"
              >
                <Tab eventKey={activeTabKeys.configure} title="Configure">
                  <div style={{ marginTop: '10px', marginBottom: '6px' }}>
                    <ButtonGroup>
                      {!isEmpty(store.activePanelState) &&
                        <Button
                          onClick={store.saveActivePanel}
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
                          onClick={store.revertActivePanel}
                          disabled={!unsavedChanges}
                          title={unsavedChanges ? 'Undo unsaved changes' : 'No changes to undo'}
                        >
                          <FaUndo style={{ verticalAlign: 'text-top' }} />
                          {' Undo'}
                        </Button>
                      }
                      {(store.panelState.length > 1) &&
                        <Button onClick={store.deleteActivePanel} title={`${isNewPanel ? 'Discard' : 'Delete'} current node`}>
                          <FaTrash style={{ verticalAlign: 'text-top' }} />{` ${isNewPanel ? 'Discard' : 'Delete'}`}
                        </Button>
                      }
                      <Button onClick={() => store.newActivePanel(panelTypes.input)}>
                        <FaPlus style={{ verticalAlign: 'text-top' }} />{' New Input'}
                      </Button>
                      {atleastOneInput &&
                        <Button onClick={() => store.newActivePanel(panelTypes.operation)}>
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
                          {!isEmpty(store.activePanelState) &&
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
                        curieList={toJS(store.activePanelState.result)}
                        defaults={{ type: '', label: '<N/A>' }}
                      />
                    </div>
                  }
                </Tab>
              </Tabs>
            </Col>
          </Row>
        </Grid>
        <Footer config={this.props.config} />
      </div>
    );
  }

  render() {
    const ready = this.props.store.dataReady && this.state.userReady;
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
