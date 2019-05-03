import React from 'react';
import Dialog from 'react-bootstrap-dialog';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import {
  Grid, Row, Col, Panel, OverlayTrigger,
  Form, FormControl, FormGroup,
} from 'react-bootstrap';
import FaInfoCircle from 'react-icons/lib/fa/info-circle';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import MachineQuestionViewContainer, { graphStates } from './components/shared/MachineQuestionViewContainer';
import { questionGraphPopover, questionNamePopover } from './components/shared/Popovers';
import LoadingNlpQuestionModal from './components/shared/modals/LoadingNlpQuestion';
import NewQuestionButtons from './components/shared/NewQuestionButtons';
import questionTemplates from '../queries/index';
import QuestionTemplateModal from './components/shared/modals/QuestionTemplate';

const _ = require('lodash');

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
    this.onQuestionTemplate = this.onQuestionTemplate.bind(this);
    this.getNlpParsedQuestion = this.getNlpParsedQuestion.bind(this);
    this.toggleModal = this.toggleModal.bind(this);

    this.state = {
      showQuestionTemplateModal: false,
    };
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
    if (window.confirm('Are you sure you want to reset this question? This action cannot be undone.')) {
      this.props.store.resetQuestion();
    }
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

  // Loads the question template and updates the MobX store/UI
  onQuestionTemplate(question) {
    this.props.store.machineQuestionSpecToPanelState(question);
  }

  toggleModal() {
    this.setState(prevState => ({ showQuestionTemplateModal: !prevState.showQuestionTemplateModal }));
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

  render() {
    const { store } = this.props;
    const ready = store.conceptsReady && store.dataReady && store.userReady && store.predicatesReady;
    const questionList = _.cloneDeep(questionTemplates);
    const { showQuestionTemplateModal } = this.state;
    return (
      <div>
        {ready ?
          <div className="question-new">
            <Header
              config={this.props.config}
              user={toJS(store.user)}
            />
            <Grid>
              <Row>
                <Col md={12}>
                  <NewQuestionButtons
                    onDownloadQuestion={this.onDownloadQuestion}
                    onDropFile={this.onDropFile}
                    onResetQuestion={this.onResetQuestion}
                    onSubmitQuestion={this.onSubmitQuestion}
                    toggleModal={this.toggleModal}
                    graphValidationState={store.graphValidationState}
                  />
                </Col>
                <Col md={12}>
                  <h3 style={{ display: 'inline-block' }}>
                    {'Question '}
                    <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={questionNamePopover}>
                      <FaInfoCircle size={17} />
                    </OverlayTrigger>
                  </h3>
                  <Form horizontal onSubmit={e => e.preventDefault()}>
                    <FormGroup
                      bsSize="large"
                      controlId="formHorizontalNodeIdName"
                      validationState={store.questionName.length > 0 ? 'success' : 'error'}
                      style={{ margin: '0' }}
                    >
                      <FormControl
                        type="text"
                        value={store.questionName}
                        onChange={e => store.updateQuestionName(e.target.value)}
                      />
                    </FormGroup>
                  </Form>
                </Col>
                <Col md={12}>
                  <Panel>
                    <Panel.Heading>
                      <Panel.Title>
                        {'Machine Question Editor - Question Graph '}
                        <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={questionGraphPopover}>
                          <FaInfoCircle size={17} />
                        </OverlayTrigger>
                      </Panel.Title>
                    </Panel.Heading>
                    <Panel.Body style={{ padding: '0px' }}>
                      <MachineQuestionViewContainer
                        height="350px"
                        width={this.props.width}
                      />
                    </Panel.Body>
                  </Panel>
                </Col>
              </Row>
            </Grid>
            <Footer config={this.props.config} />
            <Dialog ref={(el) => { this.dialog = el; }} />
            {store.nlpFetching && <LoadingNlpQuestionModal />}
            <QuestionTemplateModal
              showModal={showQuestionTemplateModal}
              toggleModal={this.toggleModal}
              questions={questionList}
              selectQuestion={this.onQuestionTemplate}
              concepts={toJS(store.concepts)}
            />
          </div>
          :
          <Loading />
        }
      </div>
    );
  }
}

export default QuestionNew;
