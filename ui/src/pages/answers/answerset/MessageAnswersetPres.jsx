import React, { useState } from 'react';

import {
  Row, Col, Grid, Tabs, Tab,
} from 'react-bootstrap';

import QuestionHeader from '../../../components/shared/questionHeader/QuestionHeader';

import AnswersetGraph from './AnswersetGraph';
import MessageAnswersetTable from './MessageAnswersetTable';
import SimpleQuestionGraph from '../../../components/shared/graphs/SimpleQuestionGraph';

export const answerSetTabEnum = {
  // answerList: 1,
  // interactive: 2,
  answerTable: 1,
  aggregate: 2,
};

export default function MessageAnswersetPres(props) {
  const {
    messageStore, concepts, question, style, omitHeader, enableQuestionSelect,
    enableQuestionEdit, callbackQuestionUpdateMeta, callbackQuestionSelect, urlQuestion,
    callbackAnswersetSelect, urlAnswerset,
  } = props;
  const [tabKey, setTabKey] = useState(answerSetTabEnum.answerTable);

  function onDownload() {
    const data = messageStore.message;

    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // This doesn't use Blob() might also work
    // var url = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'answerset.json';
    a.href = url;
    a.click();
    a.remove();
  }

  const hasAnswers = messageStore.message.answers && Array.isArray(messageStore.message.answers) && messageStore.message.answers.length > 0;
  return (
    <div>
      {hasAnswers ? (
        <div style={style}>
          {!omitHeader && (
            <Row>
              <Col md={12}>
                <QuestionHeader
                  question={question}
                  answerset={messageStore.message}

                  enableQuestionSelect={enableQuestionSelect}
                  enableQuestionEdit={enableQuestionEdit}
                  callbackUpdate={callbackQuestionUpdateMeta}
                  callbackQuestionSelect={callbackQuestionSelect}
                  urlQuestion={urlQuestion}

                  callbackAnswersetSelect={callbackAnswersetSelect}
                  urlAnswerset={urlAnswerset}

                  showDownload
                  callbackDownload={onDownload}
                />
              </Col>
            </Row>
          )}
          <SimpleQuestionGraph
            messageStore={messageStore}
            concepts={concepts}
          />
          <Tabs
            activeKey={tabKey}
            onSelect={setTabKey}
            animation
            id="answerset_tabs"
            mountOnEnter
          >
            {/* <Tab
              eventKey={answerSetTabEnum.answerList}
              title="Answers List"
            >
              <AnswersetList
                user={this.props.user} // Needed to parse feedback to know what is yours
                answers={this.props.answers}
                answersetFeedback={this.props.answersetFeedback}
                answerId={this.props.answerId} // Monitored for select by parameter or page load
                concepts={this.props.concepts}

                enableUrlChange={this.props.enableUrlChange}
                enableFeedbackSubmit={this.props.enableFeedbackSubmit}
                enableFeedbackView={this.props.enableFeedbackView}

                callbackAnswerSelected={this.props.callbackAnswerSelected}
                callbackNoAnswerSelected={this.props.callbackNoAnswerSelected}
                callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
                enabledAnswerLink={this.props.enabledAnswerLink}
                getAnswerUrl={this.props.getAnswerUrl}

                store={this.answersetStore}
              />
            </Tab> */}
            <Tab
              eventKey={answerSetTabEnum.answerTable}
              title="Answers Table"
            >
              <MessageAnswersetTable
                concepts={concepts}
                // callbackAnswerSelected={this.props.callbackAnswerSelected}
                messageStore={messageStore}
              />
            </Tab>
            <Tab
              eventKey={answerSetTabEnum.aggregate}
              title="Aggregate Graph"
            >
              <AnswersetGraph
                concepts={concepts}
                messageStore={messageStore}
              />
            </Tab>
          </Tabs>
        </div>
      ) : (
        <Grid>
          <h4>
            No answers were found.
          </h4>
        </Grid>
      )}
    </div>
  );
}
