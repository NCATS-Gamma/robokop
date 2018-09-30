import React from 'react';
import Dialog from 'react-bootstrap-dialog';

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
import GoQuestion from 'react-icons/lib/go/question';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import QuestionDesign from './components/shared/QuestionDesign';
import EdgePanel from './components/shared/EdgePanel';
import NodePanel from './components/shared/NodePanel';
import MachineQuestionViewContainer from './components/shared/MachineQuestionViewContainer';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { panelTypes } from './stores/newQuestionStore';
import entityNameDisplay from './components/util/entityNameDisplay';

const shortid = require('shortid');
const _ = require('lodash');

const questionGraphPopover = (
  <Popover id="popover-positioned-right-2" title="Machine Question Editor Overview">
    <p>
      This graph provides an update view of the Machine question as it is construted by the user.
    </p>
    <p>
      Each node and edge in the graph can be clicked on to display and edit the relevant node/edge details in
      the panel below the graph. Changes must be saved by clicking the &#91;<FaFloppyO size={14} /> Save&#93;
      button in the toolbar below the graph.
    </p>
    <p>New Nodes and Edges can be created by clicking the corresponding buttons in the
       toolbar below the graph.
    </p>
    <p>
      The <FaUpload size={14} /> <FaDownload size={14} /> <FaTrash size={14} /> buttons in the title bar
      of the Graph panel can be clicked to import, export or reset the current workflow.
    </p>
  </Popover>
);

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
        <span style={{ fontSize: '22px' }} title="Submit Question">
          <FaPaperPlaneO style={{ cursor: 'pointer' }} onClick={onSubmitWorkflow} />
        </span>
      </div>
      <div
        style={buttonStyles}
        className="btn btn-default"
      >
        <span style={{ fontSize: '22px' }} title="Import Machine Question from JSON">
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
        <span style={{ fontSize: '22px' }} title="Download Machine Question as JSON">
          <FaDownload style={{ cursor: 'pointer' }} onClick={onDownloadWorkflow} />
        </span>
      </div>
      {/* Delete/ Reset Graph Button */}
      <div
        style={buttonStyles}
        className="btn btn-default"
      >
        <span style={{ fontSize: '22px' }} title="Reset Machine Question editor">
          <FaTrash style={{ cursor: 'pointer' }} onClick={onResetGraph} />
        </span>
      </div>
    </div>
  );
};

const ButtonGroupPanel = observer(({ store }) => {
  const unsavedChanges = store.isUnsavedChanges;
  const { isValid: isValidPanel } = store.activePanelState;
  const atleastTwoNodes = store.panelState.some(panel => panel.panelType === panelTypes.node);
  const isNewPanel = store.activePanelInd === store.panelState.length;
  return (
    <div style={{ marginTop: '10px', marginBottom: '6px' }}>
      <ButtonGroup>
        {!_.isEmpty(store.activePanelState) &&
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
        {(store.panelState.length > 0) &&
          <Button onClick={store.deleteActivePanel} title={`${isNewPanel ? 'Discard' : 'Delete'} current node`}>
            <FaTrash style={{ verticalAlign: 'text-top' }} />{` ${isNewPanel ? 'Discard' : 'Delete'}`}
          </Button>
        }
        <Button onClick={() => store.newActivePanel(panelTypes.node)}>
          <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' New Node'}
        </Button>
        {atleastTwoNodes &&
          <Button onClick={() => store.newActivePanel(panelTypes.edge)}>
            <FaPlus style={{ verticalAlign: 'text-top' }} />{' New Edge'}
          </Button>
        }
      </ButtonGroup>
    </div>
  );
});

@inject(({ store }) => ({ store }))
@observer
class QuestionNew extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);
    this.onCreate = this.onCreate.bind(this);
  }

  componentDidMount() {
    this.props.store.getQuestionData(this.props.initializationId);
    console.log('Mobx Store:', this.props.store);
  }

  onCreate({ questionText, machineQuestion }) {
    const newBoardInfo = {
      natural_question: questionText,
      notes: '',
      machine_question: machineQuestion,
    };

    // Splash wait overlay
    this.dialogWait({
      title: 'Creating Question...',
      text: '',
      showLoading: true,
    });

    this.appConfig.questionCreate(
      newBoardInfo,
      data => this.appConfig.redirect(this.appConfig.urls.question(data)), // Success redirect to the new question page
      (err) => {
        this.dialogMessage({
          title: 'Trouble Creating Question',
          text: `We ran in to problems creating this question. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators. ${err.response.data.message}`,
          buttonText: 'OK',
          buttonAction: () => {},
        });
      },
    );
  }

  dialogWait(inputOptions) {
    const defaultOptions = {
      title: 'Hi',
      text: 'Please wait...',
      showLoading: false,
    };
    const options = { ...defaultOptions, ...inputOptions };

    const bodyNode = (
      <div>
        {options.text}
        {options.showLoading &&
          <Loading />
        }
      </div>
    );

    // Show custom react-bootstrap-dialog
    this.dialog.show({
      title: options.title,
      body: bodyNode,
      actions: [],
      bsSize: 'large',
      onHide: () => {},
    });
  }

  dialogMessage(inputOptions) {
    const defaultOptions = {
      title: 'Hi',
      text: 'How are you?',
      buttonText: 'OK',
      buttonAction: () => {},
    };
    const options = { ...defaultOptions, ...inputOptions };

    // Show custom react-bootstrap-dialog
    this.dialog.show({
      title: options.title,
      body: options.text,
      actions: [
        Dialog.Action(
          options.buttonText,
          (dialog) => { dialog.hide(); options.buttonAction(); },
          'btn-primary',
        ),
      ],
      bsSize: 'large',
      onHide: (dialog) => {
        dialog.hide();
      },
    });
  }

  getActivePanel() {
    const { activePanelState } = this.props.store;
    if (_.isEmpty(activePanelState)) {
      return null;
    }
    if (activePanelState.panelType === panelTypes.node) {
      return (
        <Panel style={{ marginBottom: '5px' }}>
          <Panel.Heading>
            <Panel.Title>
              {`Node ${activePanelState.panelName} `}
              <OverlayTrigger
                trigger={['hover', 'focus']}
                overlay={questionGraphPopover} // TODO: Make custom popover
                placement="right"
              >
                <FaInfoCircle size={12} />
              </OverlayTrigger>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <NodePanel activePanel={activePanelState} />
          </Panel.Body>
        </Panel>
      );
    }
    // Edge Panel
    return (
      <Panel style={{ marginBottom: '5px' }}>
        <Panel.Heading>
          <Panel.Title>
            {`Edge ${activePanelState.panelName} `}
            <OverlayTrigger
              trigger={['hover', 'focus']}
              overlay={questionGraphPopover} // TODO: Make custom popover
              placement="right"
            >
              <FaInfoCircle size={12} />
            </OverlayTrigger>
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <EdgePanel activePanel={activePanelState} />
        </Panel.Body>
      </Panel>
    );
  }

  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    const { store } = this.props;
    // const questionHelp = (
    //   <Popover id="queryTooltip" key={shortid.generate()} title="Question Help" style={{ minWidth: '500px' }}>
    //     <div style={{ textAlign: 'left' }}>
    //       <p>
    //         Questions are asked in plain English with some domain specific parsing. We can link together a variety of biomedical concepts using several predicts.
    //       </p>
    //     </div>
    //   </Popover>
    // );

    return (
      <div>
        <Header
          config={this.props.config}
          user={toJS(store.user)}
        />
        <Grid>
          <Row>
            <Col md={12}>
              <Panel>
                <Panel.Heading>
                  <Panel.Title>
                    {'Machine Question Editor - Question Graph '}
                    <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={questionGraphPopover}>
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
                  <MachineQuestionViewContainer
                    height="350px"
                    width={this.props.width}
                  />
                </Panel.Body>
              </Panel>
              <ButtonGroupPanel store={store} />
              {this.getActivePanel()}

              {/* <div style={{ paddingLeft: 15, paddingRight: 15 }}>
                <h1>Start a New Question</h1>
                <p>
                  Type your question in the box below. To get started quickly, explore the examples by clicking on the arrow on the right.
                  <OverlayTrigger placement="right" overlay={questionHelp}>
                    <span> {'    '} <GoQuestion /> </span>
                  </OverlayTrigger>
                </p>
              </div> */}
              {/* <QuestionDesign
                height={750}
                initializationData={{ question: store.questionName, machineQuestion: toJS(store.machineQuestion) }}
                concepts={toJS(store.concepts)}
                nextText="Create"
                nextCallback={this.onCreate}
                nlpParse={this.appConfig.questionNewTranslate}
              /> */}
            </Col>
          </Row>
        </Grid>
        <Footer config={this.props.config} />
        <Dialog ref={(el) => { this.dialog = el; }} />
      </div>
    );
  }
  render() {
    const { store } = this.props;
    const ready = store.conceptsReady && store.dataReady && store.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default QuestionNew;
