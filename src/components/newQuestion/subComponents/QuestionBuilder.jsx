import React from 'react';
import { observer } from 'mobx-react';
import Dropzone from 'react-dropzone';
import FaUpload from 'react-icons/lib/fa/upload';
import FaFolder from 'react-icons/lib/fa/folder';
import GoRepoForked from 'react-icons/lib/go/repo-forked';
import { Col, Form, FormGroup, FormControl, Panel, Jumbotron, Button } from 'react-bootstrap';
import _ from 'lodash';
import { toJS } from 'mobx';

import AppConfig from '../../../AppConfig';
import { config } from '../../../index';
import HelpButton from '../../shared/HelpButton';
import NewQuestionButtons from './NewQuestionButtons';
import MachineQuestionViewContainer, { graphStates } from './MachineQuestionViewContainer';
import QuestionTemplateModal from './QuestionTemplate';
import QuestionListModal from './QuestionListModal';
import questionTemplates from '../../../../queries/index';

@observer
class QuestionBuilder extends React.Component {
  constructor(props) {
    super(props);

    this.questionName = null; // ref to questionName text field
    this.appConfig = new AppConfig(config);
    this.state = {
      showQuestionTemplateModal: false,
      step: 1,
      questions: [],
      questionsReady: false,
    };

    this.selectOption = this.selectOption.bind(this);
    this.onQuestionTemplate = this.onQuestionTemplate.bind(this);
    this.onDropFile = this.onDropFile.bind(this);
    this.getQuestions = this.getQuestions.bind(this);
    this.questionSelected = this.questionSelected.bind(this);
    this.submitQuestionName = this.submitQuestionName.bind(this);
    this.reset = this.reset.bind(this);
    this.hideQuestionTemplateModal = this.hideQuestionTemplateModal.bind(this);
  }

  selectOption(option) {
    if (option === 'blank') {
      this.setState({ step: 2 }, () => this.questionName.focus());
    } else if (option === 'template') {
      this.setState({ showQuestionTemplateModal: true });
    }
  }

  // Loads the question template and updates the MobX store/UI
  onQuestionTemplate(question) {
    this.props.store.machineQuestionSpecToPanelState(question);
    this.setState({ showQuestionTemplateModal: false, step: 3 });
  }

  hideQuestionTemplateModal() {
    this.setState({ showQuestionTemplateModal: false });
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
          this.setState({ step: 3 });
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

  getQuestions() {
    this.appConfig.questionList(
      (data) => {
        this.setState({ questions: data.data.questions, questionsReady: true });
      },
      (err) => {
        console.log(err);
        this.setState({ questionsReady: false });
      },
    );
  }

  questionSelected(qid) {
    this.appConfig.questionData(
      qid,
      (data) => {
        this.props.store.machineQuestionSpecToPanelState(data.data.question);
        this.setState({ step: 3, questionsReady: false });
      },
      (err) => {
        console.log(err);
        this.props.store.resetQuestion();
        this.props.store.setGraphState(graphStates.error);
        this.setState({ step: 1, questionsReady: false });
      },
    );
  }

  submitQuestionName() {
    this.setState({ step: 3 });
  }

  reset() {
    this.props.reset();
    this.setState({ step: 1 });
  }

  render() {
    const {
      step, showQuestionTemplateModal, questionsReady, questions,
    } = this.state;
    const {
      store, download, submit, width,
    } = this.props;
    const questionList = _.cloneDeep(questionTemplates);
    return (
      <div id="questionBuilder">
        {step === 1 &&
          <Jumbotron id="newQuestionOptions">
            <Button
              className="optionsButton"
              onClick={() => this.selectOption('blank')}
            >
              <h3>Blank</h3>
              <p className="optionButtonDesc">Start building a question from the beginning.</p>
            </Button>
            <Button
              className="optionsButton"
              onClick={() => this.selectOption('template')}
            >
              <h3>Template <span style={{ fontSize: '22px' }}><FaFolder style={{ cursor: 'pointer' }} /></span></h3>
              <p className="optionButtonDesc">Choose a question template to start with a preconstructed question.</p>
            </Button>
            <Button
              className="optionsButton"
            >
              <Dropzone
                onDrop={this.onDropFile}
                multiple={false}
                style={{
                  border: 'none',
                }}
              >
                <h3>Upload <span style={{ fontSize: '22px' }}><FaUpload style={{ cursor: 'pointer' }} /></span></h3>
                <p className="optionButtonDesc">Upload a JSON file containing a valid question.</p>
              </Dropzone>
            </Button>
            <Button
              className="optionsButton"
              onClick={this.getQuestions}
            >
              <h3>Fork <span style={{ fontSize: '22px' }}><GoRepoForked style={{ cursor: 'pointer' }} /></span></h3>
              <p className="optionButtonDesc">Load from a previously asked question.</p>
            </Button>
          </Jumbotron>
        }
        {step !== 1 &&
          <Col md={12}>
            <h3 style={{ display: 'inline-block' }}>
              {'Question Title'}
            </h3>
            <Form
              horizontal
              onSubmit={e => e.preventDefault()}
              autoComplete="off"
            >
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
                  inputRef={(ref) => { this.questionName = ref; }}
                  placeholder="Please provide a title for your question."
                />
              </FormGroup>
              {step === 2 &&
                <Button
                  id="questionNameSubmit"
                  type="submit"
                  onClick={this.submitQuestionName}
                  disabled={store.questionName.length === 0}
                >
                  Next
                </Button>
              }
            </Form>
          </Col>
        }
        {step === 3 &&
          <div>
            <Col md={12}>
              <Panel>
                <Panel.Heading>
                  <Panel.Title>
                    {'Machine Question Editor - Question Graph '}
                    <HelpButton link="machineQuestionEditor" />
                  </Panel.Title>
                </Panel.Heading>
                <Panel.Body style={{ padding: '0px' }}>
                  <MachineQuestionViewContainer
                    height="350px"
                    width={width}
                  />
                </Panel.Body>
              </Panel>
            </Col>
            <Col md={12}>
              <NewQuestionButtons
                onDownloadQuestion={download}
                onResetQuestion={this.reset}
                onSubmitQuestion={submit}
                graphValidationState={store.graphValidationState}
              />
            </Col>
          </div>
        }
        <QuestionTemplateModal
          showModal={showQuestionTemplateModal}
          close={this.hideQuestionTemplateModal}
          questions={questionList}
          selectQuestion={this.onQuestionTemplate}
          concepts={toJS(this.props.store.concepts)}
        />
        <QuestionListModal
          show={questionsReady}
          close={() => this.setState({ questionsReady: false })}
          questions={questions}
          questionSelected={this.questionSelected}
        />
      </div>
    );
  }
}

export default QuestionBuilder;
