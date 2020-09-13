import React, { useState } from 'react';

import {
  Row, Col, Grid, Tabs, Tab,
} from 'react-bootstrap';

import QuestionHeader from '../questionHeader/QuestionHeader';

import KnowledgeGraph from '../graphs/KnowledgeGraph';
import ResultsTable from './resultsTable/ResultsTable';
import QuestionGraphContainer from '../graphs/QuestionGraphContainer';

export const answerSetTabEnum = {
  // answerList: 1,
  // interactive: 2,
  answerTable: 1,
  aggregate: 2,
};

/**
 * Full Answerset View
 * @param {object} messageStore message store custom hook
 * @param {array} concepts an array of node types
 * @param {string} question name of the question
 * @param {object} style custom styling to apply to answerset view container
 * @param {boolean} omitHeader omit the question header
 * @param {boolean} enableQuestionSelect can the user select this question
 * @param {boolean} enableQuestionEdit can the user update the question name
 * @param {function} callbackQuestionUpdateMeta function to update question meta data
 * @param {function} callbackQuestionSelect function to update to the selected question
 * @param {string} urlQuestion url to this specific question
 * @param {function} callbackAnswersetSelect function to update to the selected answerset
 * @param {string} urlAnswerset url to this specific answerset
 */
export default function AnswersetView(props) {
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

  const hasResults = messageStore.message.results && Array.isArray(messageStore.message.results) && messageStore.message.results.length > 0;
  return (
    <div>
      {hasResults ? (
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
          <QuestionGraphContainer
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
              title="Results Table"
            >
              <ResultsTable
                concepts={concepts}
                // callbackAnswerSelected={this.props.callbackAnswerSelected}
                messageStore={messageStore}
              />
            </Tab>
            <Tab
              eventKey={answerSetTabEnum.aggregate}
              title="Knowledge Graph"
            >
              <KnowledgeGraph
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
