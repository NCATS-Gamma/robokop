import React, { useState, useEffect, useRef } from 'react';
import Dropzone from 'react-dropzone';
import { FaUpload, FaFolder } from 'react-icons/fa';
import { GoRepoForked } from 'react-icons/go';
import {
  Col, Form, FormGroup, FormControl, Panel, Jumbotron, Button,
} from 'react-bootstrap';
import _ from 'lodash';

import HelpButton from '../../../components/shared/HelpButton';
import NewQuestionButtons from './NewQuestionButtons';
import QuestionGraphViewContainer, { graphStates } from './QuestionGraphViewContainer';
import QuestionTemplateModal from './QuestionTemplate';
import QuestionListModal from './QuestionListModal';
import questionTemplates from '../../../../../queries/index';

import config from '../../../config.json';

export default function QuestionBuilder(props) {
  const {
    questionStore, reset, download, submit, width,
  } = props;
  const [showModal, toggleModal] = useState(false);
  const [step, setStep] = useState('options');
  const [questions, updateQuestions] = useState([]);
  const [questionsReady, setQuestionsReady] = useState(false);
  const questionName = useRef(null);

  function submitQuestionName() {
    setStep('build');
  }

  useEffect(() => {
    if (questionStore.questionName && questionStore.graphState === graphStates.display) {
      submitQuestionName();
    }
  }, []);

  function selectOption(option) {
    if (option === 'blank') {
      setStep('questionName');
    } else if (option === 'template') {
      toggleModal(true);
    }
  }

  useEffect(() => {
    if (step === 'questionName') {
      questionName.current.focus();
    }
  }, [step]);

  // Loads the question template and updates the MobX store/UI
  function onQuestionTemplate(question) {
    questionStore.machineQuestionSpecToPanelState(question);
    toggleModal(false);
    setStep('build');
  }

  function onDropFile(acceptedFiles, rejectedFiles) { // eslint-disable-line no-unused-vars
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => questionStore.setGraphState(graphStates.fetching);
      // fr.onloadend = () => this.setState({ graphState: graphStates.fetching });
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const fileContentObj = JSON.parse(fileContents);
          questionStore.machineQuestionSpecToPanelState(fileContentObj);
          setStep('build');
        } catch (err) {
          console.error(err);
          window.alert('Failed to read this Question template. Are you sure this is valid?');
          questionStore.setGraphState(graphStates.error);
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file. The file may be invalid JSON.');
        questionStore.resetQuestion();
        questionStore.setGraphState(graphStates.error);
      };
      fr.readAsText(file);
    });
  }

  function getQuestions() {
    console.log('get questions');
    // this.appConfig.questionList(
    //   (data) => {
    //     updateQuestions(data.data.questions);
    //     setQuestionsReady(true);
    //   },
    //   (err) => {
    //     console.log(err);
    //     setQuestionsReady(false);
    //   },
    // );
  }

  function questionSelected(qid) {
    console.log('question selected', qid);
    // this.appConfig.questionData(
    //   qid,
    //   (data) => {
    //     questionStore.machineQuestionSpecToPanelState(data.data.question);
    //     setStep('build');
    //     setQuestionsReady(false);
    //   },
    //   (err) => {
    //     console.log(err);
    //     questionStore.resetQuestion();
    //     questionStore.setGraphState(graphStates.error);
    //     setStep('options');
    //     setQuestionsReady(false);
    //   },
    // );
  }

  function resetSteps() {
    reset();
    setStep('options');
  }

  return (
    <div id="questionBuilder">
      {step === 'options' && (
        <Jumbotron id="newQuestionOptions">
          <Button
            className="optionsButton"
            onClick={() => selectOption('blank')}
          >
            <h3>Blank</h3>
            <p className="optionButtonDesc">Start building a question from the beginning.</p>
          </Button>
          <Button
            className="optionsButton"
            onClick={() => selectOption('template')}
          >
            <h3>Template <span style={{ fontSize: '22px' }}><FaFolder style={{ cursor: 'pointer' }} /></span></h3>
            <p className="optionButtonDesc">Choose a question template to start with a preconstructed question.</p>
          </Button>
          <Button
            className="optionsButton"
          >
            <Dropzone
              onDrop={(acceptedFiles, rejectedFiles) => onDropFile(acceptedFiles, rejectedFiles)}
              multiple={false}
              style={{
                border: 'none',
              }}
            >
              {({ getRootProps, getInputProps }) => (
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <h3>Upload <span style={{ fontSize: '22px' }}><FaUpload style={{ cursor: 'pointer' }} /></span></h3>
                  <p className="optionButtonDesc">Upload a JSON file containing a valid question.</p>
                </div>
              )}
            </Dropzone>
          </Button>
          <Button
            className="optionsButton"
            onClick={getQuestions}
          >
            <h3>Fork <span style={{ fontSize: '22px' }}><GoRepoForked style={{ cursor: 'pointer' }} /></span></h3>
            <p className="optionButtonDesc">Load from a previously asked question.</p>
          </Button>
        </Jumbotron>
      )}
      {step !== 'options' && (
        <Col md={12}>
          <h3 style={{ display: 'inline-block' }}>
            Question Title
          </h3>
          <Form
            horizontal
            onSubmit={(e) => e.preventDefault()}
            autoComplete="off"
          >
            <FormGroup
              bsSize="large"
              controlId="formHorizontalNodeIdName"
              validationState={questionStore.questionName.length > 0 ? 'success' : 'error'}
              style={{ margin: '0' }}
            >
              <FormControl
                type="text"
                value={questionStore.questionName}
                onChange={(e) => questionStore.updateQuestionName(e.target.value)}
                inputRef={(ref) => { questionName.current = ref; }}
                placeholder="Please provide a title for your question."
              />
            </FormGroup>
            {step === 'questionName' && (
              <Button
                id="questionNameSubmit"
                type="submit"
                onClick={submitQuestionName}
                disabled={questionStore.questionName.length === 0}
              >
                Next
              </Button>
            )}
          </Form>
        </Col>
      )}
      {step === 'build' && (
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
                <QuestionGraphViewContainer
                  questionStore={questionStore}
                  height="350px"
                  width={width}
                />
              </Panel.Body>
            </Panel>
          </Col>
          <Col md={12}>
            <NewQuestionButtons
              onDownloadQuestion={download}
              onResetQuestion={resetSteps}
              onSubmitQuestion={submit}
              graphValidationState={questionStore.graphValidationState()}
            />
          </Col>
        </div>
      )}
      <QuestionTemplateModal
        showModal={showModal}
        close={() => toggleModal(false)}
        questions={_.cloneDeep(questionTemplates)}
        selectQuestion={onQuestionTemplate}
        concepts={config.concepts}
      />
      <QuestionListModal
        show={questionsReady}
        close={() => setQuestionsReady(false)}
        questions={questions}
        questionSelected={questionSelected}
      />
    </div>
  );
}
