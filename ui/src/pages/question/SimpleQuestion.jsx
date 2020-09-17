import React, { useState } from 'react';
import {
  Grid, Row, Tabs, Tab,
} from 'react-bootstrap';
import { FaDownload } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import './newQuestion.css';
// import AnswersetStore from '../../stores/messageAnswersetStore';
import Loading from '../../components/loading/Loading';
import MessageAnswersetTable from '../../components/shared/answersetView/answersTable/AnswersTable';
import AnswersetGraph from '../../components/shared/graphs/AnswersetGraph';
import QuestionGraphContainer from '../../components/shared/graphs/QuestionGraphContainer';
import QuickQuestionError from './subComponents/QuickQuestionError';
import QuestionBuilder from './questionBuilder/QuestionBuilder';

import useMessageStore from '../../stores/useMessageStore';
import useQuestionStore from './useQuestionStore';
import config from '../../config.json';

export default function SimpleQuestion(props) {
  const { user } = props;
  const [tabKey, setTabKey] = useState(1);
  const [fail, setFail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const messageStore = useMessageStore();
  const questionStore = useQuestionStore();

  function onDownloadQuestion() {
    const data = questionStore.getMachineQuestionSpecJson;
    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'robokopMachineQuestion.json';
    a.href = url;
    a.click();
    a.remove();
  }

  function onDownloadAnswer() {
    const data = messageStore.message;

    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'answerset.json';
    a.href = url;
    a.click();
    a.remove();
  }

  function onResetQuestion() {
    if (window.confirm('Are you sure you want to reset this question? This action cannot be undone.')) {
      messageStore.setMessage({});
    }
  }

  function onSubmit() {
    const questionText = questionStore.questionName;
    const machineQuestion = questionStore.getMachineQuestionSpecJson.machine_question;
    const maxConnect = questionStore.max_connectivity;
    const newBoardInfo = {
      natural_question: questionText,
      notes: '',
      machine_question: machineQuestion,
      max_connectivity: maxConnect,
    };
    setLoading(true);
    setReady(false);
    // this.appConfig.simpleQuick(
    //   newBoardInfo,
    //   (data) => {
    //     if (!data.answers.length) {
    //       throw Error('No answers were found');
    //     }
    //     messageStore.setMessage(data);
    //     setLoading(false);
    //     setReady(true);
    //   },
    //   (err) => {
    //     console.log('Trouble asking question:', err);
    //     if (err.response || err.response) {
    //       setErrorMessage('Please check the console for a more descriptive error message');
    //     } else {
    //       setErrorMessage(err.message);
    //     }
    //     setLoading(false);
    //     setFail(true);
    //   },
    // );
  }

  function resetQuestion() {
    setFail(false);
    setErrorMessage('');
  }

  return (
    <Grid>
      <Row>
        {!loading && !ready && (
          <>
            <h1 className="robokopApp">
              Ask a Quick Question
              <br />
              <small>
                {'This question will not be saved. If you would like to save a question, please '}
                {user ? (
                  <Link to="/q/new">
                    go here.
                  </Link>
                ) : (
                  'sign in.'
                )}
              </small>
            </h1>
            <QuestionBuilder
              questionStore={questionStore}
              download={onDownloadQuestion}
              reset={onResetQuestion}
              submit={onSubmit}
            />
          </>
        )}
        {ready && (
          <>
            <div style={{ position: 'block', paddingBottom: '10px' }}>
              <h1 style={{ display: 'inline' }}>{questionStore.questionName}</h1>
              <span style={{ fontSize: '22px', float: 'right', marginTop: '10px' }} title="Download">
                <FaDownload style={{ cursor: 'pointer' }} onClick={onDownloadAnswer} />
              </span>
            </div>
            <QuestionGraphContainer
              messageStore={messageStore}
              concepts={config.concepts}
            />
            <Tabs
              activeKey={tabKey}
              onSelect={(e) => setTabKey(e)}
              animation
              id="answerset_tabs"
              mountOnEnter
            >
              <Tab
                eventKey={1}
                title="Answers Table"
              >
                <MessageAnswersetTable
                  concepts={config.concepts}
                  messageStore={messageStore}
                />
              </Tab>
              <Tab
                eventKey={2}
                title="Aggregate Graph"
              >
                <AnswersetGraph
                  concepts={config.concepts}
                  messageStore={messageStore}
                />
              </Tab>
            </Tabs>
          </>
        )}
        {loading && (
          <Loading
            message={<p style={{ textAlign: 'center' }}>Loading Answerset</p>}
          />
        )}
      </Row>
      <QuickQuestionError
        showModal={fail}
        closeModal={resetQuestion}
        errorMessage={errorMessage}
      />
    </Grid>
  );
}
