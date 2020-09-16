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
import QuestionGraphViewContainer from './QuestionGraphViewContainer';
import QuestionTemplateModal from './QuestionTemplate';
import QuestionListModal from './QuestionListModal';
// import questionTemplates from '../../../../../queries/index';

import config from '../../../config.json';
/**
 * Main Question Builder component
 * @param {object} questionStore new question custom hook
 * @param {function} download function to download the current question spec
 * @param {function} reset function to reset the message store custom hook
 * @param {function} submit function to ask the current question
 * @param {string} width width of the question graph viewer
 */
export default function QuestionBuilder(props) {
  const {
    questionStore, reset, download, submit, width,
  } = props;
  const [showModal, toggleModal] = useState(false);
  const [step, setStep] = useState('options');
  const [questions, updateQuestions] = useState([]);
  const [questionsReady, setQuestionsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  // used just for focus
  const questionName = useRef(null);

  useEffect(() => {
    if (questionStore.question_name) {
      setStep('build');
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

  /**
   * Load the selected question template
   * @param {object} question json object of format
   * @param {string} question.question_name name of the question
   * @param {Object} question.query_graph consisting of nodes and edges
   * @param {Array} question.query_graph.nodes an array of nodes
   * @param {Array} question.query_graph.edges an array of edges
   * @param {Number} question.max_connectivity max connections for question
   */
  function onQuestionTemplate(question) {
    questionStore.questionSpecToPanelState(question);
    setStep('build');
    toggleModal(false);
  }

  function onDropFile(acceptedFiles, rejectedFiles) { // eslint-disable-line no-unused-vars
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => setLoading(true);
      // fr.onloadend = () => this.setState({ graphState: graphStates.fetching });
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const fileContentObj = JSON.parse(fileContents);
          questionStore.questionSpecToPanelState(fileContentObj);
          setStep('build');
          setLoading(false);
        } catch (err) {
          console.error(err);
          // window.alert('Failed to read this Question template. Are you sure this is valid?');
          // questionStore.setGraphState(graphStates.error);
          setLoading(false);
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file. The file may be invalid JSON.');
        questionStore.resetQuestion();
        setLoading(false);
        // questionStore.setGraphState(graphStates.error);
      };
      fr.readAsText(file);
    });
  }

  function getQuestions() {
    console.log('get questions');
    setQuestionsReady(true);
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

  /**
   * Load the selected question by ID
   * @param {String} qid Unique ID of a question in the db
   */
  function questionSelected(qid) {
    console.log('question selected', qid);
    // this will go get the question from the db
    // this.appConfig.questionData(
    //   qid,
    //   (data) => {
    //     questionStore.questionSpecToPanelState(data.data.question);
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
              validationState={questionStore.question_name.length > 0 ? 'success' : 'error'}
              style={{ margin: '0' }}
            >
              <FormControl
                type="text"
                value={questionStore.question_name}
                onChange={(e) => questionStore.updateQuestionName(e.target.value)}
                inputRef={(ref) => { questionName.current = ref; }}
                placeholder="Please provide a title for your question."
              />
            </FormGroup>
            {step === 'questionName' && (
              <Button
                id="questionNameSubmit"
                type="submit"
                onClick={() => setStep('build')}
                disabled={questionStore.question_name.length === 0}
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
                  {'Question Graph Editor '}
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
              validQuestion={questionStore.isValidQuestion()}
            />
          </Col>
        </div>
      )}
      <QuestionTemplateModal
        showModal={showModal}
        close={() => toggleModal(false)}
        // questions={_.cloneDeep(questionTemplates)}
        questions={[]}
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
