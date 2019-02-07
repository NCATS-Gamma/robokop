import React from 'react';
import Dialog from 'react-bootstrap-dialog';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import {
  Grid, Row, Col, Button, ButtonGroup, Panel, Popover, OverlayTrigger, MenuItem,
  Form, FormControl, FormGroup, ControlLabel, Tooltip, Modal, DropdownButton, InputGroup,
} from 'react-bootstrap';
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
import FaWrench from 'react-icons/lib/fa/wrench';
// import GoQuestion from 'react-icons/lib/go/question';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import MachineQuestionEditor from './components/shared/MachineQuestionEditor';
import EdgePanel from './components/shared/EdgePanel';
import NodePanel from './components/shared/NodePanel';
import MachineQuestionViewContainer, { graphStates } from './components/shared/MachineQuestionViewContainer';
import questions from './components/util/questionTemplates';
import { panelTypes } from './stores/newQuestionStore';
// import LabeledFormGroup from './components/shared/LabeledFormGroup';

const _ = require('lodash');

const questionGraphPopover = (
  <Popover id="popover-positioned-right-2" title="Machine Question Editor Overview">
    <p>
      This graph provides an updated view of the Machine question as it is constructed by the user.
      Each node and edge in the graph can be clicked on to display and edit the relevant node/edge details in
      the panel below the graph. The active Node or Edge is indicated by a thicker edge width. Any node that
      represents a set is indicated by a thicker border.
    </p>
    <p>
      Note: Deleted nodes are still shown in grey with a dashed border until any edges that link to the deleted
      node are set to point to valid nodes, or themselves deleted.
    </p>
    <p><strong>Graph Panel Toolbar</strong><br />
      The [<FaUpload size={14} />], [<FaDownload size={14} />] and [<FaTrash size={14} />] buttons in the title bar
      of the Graph panel can be clicked to import, export (as a JSON file) or reset the current question.
      The [<FaPaperPlaneO size={14} />] button submits the current question to ROBOKOP. The user can also pre-populate
      the question graph from a list of pre-existing question templates that are available through the drop-down menu
      in the graph panel toolbar.
    </p>
    <p><strong>Edge / Node Panel Toolbar</strong><br />
      The toolbar above the Node / Edge panel enables the user to [Save <FaFloppyO size={14} />] or [Undo <FaUndo size={14} />]
      any changes, [Delete <FaTrash size={14} />] the current Node / Edge or create
      a new Node [<FaPlusSquare size={14} />] or Edge [<FaPlus size={14} />]. Additionally, the user can
      edit the JSON form of the graph specification in a JSON editor by clicking the [Edit JSON <FaWrench size={14} />] button.
    </p>
  </Popover>
);

const nodePanelPopover = (
  <Popover id="popover-positioned-right" title="Node Builder Help">
    <p>
      Each Node <strong>must</strong> have a valid Node Type specified. If Curies are enabled, then
      each curie input area must have a valid Curie selected. Nodes with one or more curies associated
      with them are highlighted with an asterisk [*] at the end of the node name.
    </p>
    <p>
      The Curie selector can be used to specify a curie for the specified Node type.
      Typing text in the search field will attempt to find matches via Bionames. User can always
      specify a custom Curie by directly typing it into the field - eg: &quot;MONDO:123456&quot;.
      A curie must always be selected by clicking the &quot;Select&quot; button for the curie in the search popup box.
    </p>
    <p>
      Providing a Node name is purely optional, but can make navigating the displayed graph easier as nodes in the graph
      UI are always labeled with the Node name if provided by the user.
    </p>
  </Popover>
);

const edgePanelPopover = (
  <Popover id="popover-positioned-right" title="Node Builder Help">
    <p>
      Each Edge <strong>must</strong> have a valid Source and Target node. If an existing node is deleted,
      it is still displayed in the graph so the invalid edges referencing the deleted node can be edited
      and modified to either point to a different node, or be deleted.
    </p>
    <p>
      An edge can optionally have a predicate (if supported by Robokop). Typing in the predicate name in the
      input field lets the user create a predicate tag for the node. <strong>Note:</strong> Currently, predicates
      are not validated by the UI. The user must ensure the validity of the predicates entered into the UI.
    </p>
    <p>
      Providing a Node name is purely optional, but can make navigating the displayed graph easier as nodes in the graph
      UI are always labeled with the Node name if provided by the user.
    </p>
  </Popover>
);

const questionNamePopover = (
  <Popover title="Question help" id="popover-positioned-right">
    Text description of the question being constructed. Hitting Enter or clicking the {'"Try NLP Engine"'} button
    submits the question to the Natural Language Processing (NLP) engine that attempts to parse the question and
    return a matching machine-question specification. This can usually serve as a good starting point for further
    customizations of the machine-question via this UI.
  </Popover>
);

const loadingNlpQuestionModal = (
  <Modal show bsSize="large">
    <Modal.Header>
      <Modal.Title id="loading-nlp-question">Submitting question to NLP Parser</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>Your natural language question is being parsed by the NLP engine. Please wait...</p>
      <Loading />
    </Modal.Body>
  </Modal>
);

// Buttons displayed in title-bar of Graph Viewer
const GraphTitleButtons = ({
  onDropFile, onDownloadQuestion, onResetQuestion,
  onSubmitQuestion, graphValidationState, questionList, onQuestionTemplate,
}) => {
  const buttonStyles = { padding: '2px', marginLeft: '5px' };
  const isValidQuestion = graphValidationState.isValid;
  const errorMsg = 'Error: '.concat(graphValidationState.errorList.join(',\n '));
  return (
    <div style={{ position: 'relative', float: 'right', top: '-3px' }}>
      <DropdownButton
        bsStyle="default"
        bsSize="small"
        title="Load a question template"
        key={1}
        id="dropdown-question-template"
      >
        {questionList.map((question, i) => <MenuItem key={i} eventKey={i} onSelect={onQuestionTemplate}>{question.natural_question}</MenuItem>)}
      </DropdownButton>
      <button
        style={buttonStyles}
        className="btn btn-default"
        disabled={!isValidQuestion}
        title={isValidQuestion ? 'Submit question' : errorMsg}
        onClick={onSubmitQuestion}
      >
        <span style={{ fontSize: '22px' }}>
          <FaPaperPlaneO style={{ cursor: 'pointer' }} />
        </span>
      </button>
      <button
        style={buttonStyles}
        className="btn btn-default"
      >
        <span style={{ fontSize: '22px' }} title="Import Machine Question from JSON">
          <Dropzone
            onDrop={onDropFile}
            multiple={false}
            style={{
              border: 'none',
            }}
          >
            <FaUpload style={{ cursor: 'pointer' }} /> {/* onClick={() => {}} */}
          </Dropzone>
        </span>
      </button>
      <button
        style={buttonStyles}
        className="btn btn-default"
        disabled={!isValidQuestion}
        title={isValidQuestion ? 'Download Machine Question as JSON' : errorMsg}
        onClick={onDownloadQuestion}
      >
        <span style={{ fontSize: '22px' }}>
          <FaDownload style={{ cursor: 'pointer' }} />
        </span>
      </button>
      {/* Delete/ Reset Graph Button */}
      <button
        style={buttonStyles}
        className="btn btn-default"
        onClick={onResetQuestion}
      >
        <span style={{ fontSize: '22px' }} title="Reset Machine Question editor">
          <FaTrash style={{ cursor: 'pointer' }} />
        </span>
      </button>
    </div>
  );
};

const ButtonGroupPanel = observer(({ store, openJsonEditor }) => {
  const unsavedChanges = store.isUnsavedChanges;
  const { isValid: isValidPanel } = store.activePanelState;
  const { isValidGraph } = store.graphValidationState;
  const atleastTwoNodes = store.panelState.filter(panel => store.isNode(panel) && !panel.deleted).length > 1;
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
        <Button
          onClick={openJsonEditor}
          disabled={!isValidGraph}
          title={isValidGraph ? 'Manually edit JSON for machine question' : 'Manual JSON Editing disabled due to invalid Graph'}
        >
          <FaWrench style={{ verticalAlign: 'text-top' }} />
          {' Edit JSON'}
        </Button>
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
    this.onResetQuestion = this.onResetQuestion.bind(this);
    this.onDownloadQuestion = this.onDownloadQuestion.bind(this);
    this.onDropFile = this.onDropFile.bind(this);
    this.onSubmitQuestion = this.onSubmitQuestion.bind(this);
    this.saveJsonEditor = this.saveJsonEditor.bind(this);
    this.closeJsonEditor = this.closeJsonEditor.bind(this);
    this.openJsonEditor = this.openJsonEditor.bind(this);
    this.onQuestionTemplate = this.onQuestionTemplate.bind(this);
    this.getNlpParsedQuestion = this.getNlpParsedQuestion.bind(this);

    this.state = { showJsonEditor: false };
  }

  componentDidMount() {
    this.props.store.getQuestionData(this.props.initializationId);
    console.log('Mobx Store:', this.props.store);
  }

  componentWillUnmount() {
    this.props.store.cleanup();
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

  onDownloadQuestion() {
    const data = this.props.store.getMachineQuestionSpecJson;
    this.provideJsonDownload(data, 'robokopMachineQuestion.json');
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
          this.props.store.machineQuestionSpecToPanelState(fileContentObj);
        } catch (err) {
          console.error(err);
          window.alert('Failed to read this Question template. Are you sure this is valid?');
          this.props.store.setGraphState(graphStates.error);
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file. The file may be invalid JSON.');
        this.props.store.resetQuestion();
        this.props.store.setGraphState(graphStates.error);
      };
      fr.readAsText(file);
    });
  }

  onSubmitQuestion() {
    const { store } = this.props;
    this.onCreate({ questionText: store.questionName, machineQuestion: store.getMachineQuestionSpecJson.machine_question });
  }

  onResetQuestion() {
    this.props.store.resetQuestion();
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

  saveJsonEditor({ data }) { // { data: this.state.data, isValid: this.state.isValid }
    const { store } = this.props;
    try {
      store.machineQuestionSpecToPanelState(data);
      this.closeJsonEditor();
    } catch (err) {
      console.error(err);
      this.dialogMessage({
        title: 'Trouble Parsing Manually edited JSON',
        text: 'We ran in to problems parsing the user provided JSON. Please ensure that it is a valid MachineQuestion spec JSON file',
        buttonText: 'OK',
        buttonAction: () => {},
      });
      // window.alert('Failed to load m Question template. Are you sure this is valid?');
      store.setGraphState(graphStates.error);
    }
  }

  closeJsonEditor() {
    this.setState({ showJsonEditor: false });
  }

  openJsonEditor() {
    this.setState({ showJsonEditor: true });
  }

  // Loads the question template and updates the MobX store/UI
  onQuestionTemplate(eventKey) {
    this.props.store.machineQuestionSpecToPanelState(questions[eventKey]);
  }

  // Prevent default form submit and make call to parse NLP question via store method
  getNlpParsedQuestion(event) {
    event.preventDefault();
    this.props.store.nlpParseQuestion();
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
    const isNodePanel = activePanelState.panelType === panelTypes.node;
    return (
      <Panel style={{ marginBottom: '5px' }}>
        <Panel.Heading>
          <Panel.Title>
            {`${isNodePanel ? 'Node' : 'Edge'} ${activePanelState.panelName} `}
            <OverlayTrigger
              trigger={['hover', 'focus']}
              overlay={isNodePanel ? nodePanelPopover : edgePanelPopover}
              placement="right"
            >
              <FaInfoCircle size={12} />
            </OverlayTrigger>
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          {isNodePanel && <NodePanel activePanel={activePanelState} /> }
          {!isNodePanel && <EdgePanel activePanel={activePanelState} /> }
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

    return (
      <div className="question-new">
        <Header
          config={this.props.config}
          user={toJS(store.user)}
        />
        <Grid>
          <Row>
            <Col md={12}>
              <Form horizontal onSubmit={e => e.preventDefault()}>
                <FormGroup
                  bsSize="large"
                  controlId="formHorizontalNodeIdName"
                  validationState={store.questionName.length > 0 ? 'success' : 'error'}
                >
                  <Col componentClass={ControlLabel} md={2}>
                    <span>{'Question '}
                      <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={questionNamePopover}>
                        <FaInfoCircle size={10} />
                      </OverlayTrigger>
                    </span>
                  </Col>
                  <Col md={10}>
                    {/* <InputGroup> */}
                    <FormControl
                      type="text"
                      value={store.questionName}
                      onChange={e => store.updateQuestionName(e.target.value)}
                    />
                    {/* <InputGroup.Button>
                      <Button type="submit" bsSize="large" onClick={this.getNlpParsedQuestion}>Try NLP Engine</Button>
                    </InputGroup.Button> */}
                    {/* </InputGroup> */}
                  </Col>
                </FormGroup>
              </Form>
            </Col>
            <Col md={12}>
              <Panel>
                <Panel.Heading>
                  <Panel.Title>
                    {'Machine Question Editor - Question Graph '}
                    <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={questionGraphPopover}>
                      <FaInfoCircle size={12} />
                    </OverlayTrigger>
                    <GraphTitleButtons
                      onDownloadQuestion={this.onDownloadQuestion}
                      onDropFile={this.onDropFile}
                      onResetQuestion={this.onResetQuestion}
                      onSubmitQuestion={this.onSubmitQuestion}
                      graphValidationState={store.graphValidationState}
                      onQuestionTemplate={this.onQuestionTemplate}
                      questionList={questions}
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
              <ButtonGroupPanel store={store} openJsonEditor={this.openJsonEditor} />
              {this.getActivePanel()}
              <Modal
                bsSize="large"
                aria-labelledby="contained-modal-title-lg"
                show={this.state.showJsonEditor}
                dialogClassName="question-editor-modal"
              >
                <Modal.Body>
                  {this.state.showJsonEditor &&
                    <MachineQuestionEditor
                      height={700}
                      concepts={toJS(store.concepts)}
                      question={store.questionName}
                      machineQuestion={toJS(store.getMachineQuestionSpecJson.machine_question)}
                      callbackSave={this.saveJsonEditor}
                      callbackCancel={this.closeJsonEditor}
                    />
                  }
                </Modal.Body>
              </Modal>
            </Col>
          </Row>
        </Grid>
        <Footer config={this.props.config} />
        <Dialog ref={(el) => { this.dialog = el; }} />
        {store.nlpFetching && loadingNlpQuestionModal}
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
