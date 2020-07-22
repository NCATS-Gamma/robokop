import React from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Grid, Tabs, Tab } from 'react-bootstrap';

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


class MessageAnswersetPres extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: answerSetTabEnum.answerTable,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.onDownload = this.onDownload.bind(this);
    this.renderNoAnswers = this.renderNoAnswers.bind(this);
    this.renderAnswers = this.renderAnswers.bind(this);
  }
  onDownload() {
    const data = this.props.store.message;

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

  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }

  renderNoAnswers() {
    return (
      <Grid>
        <h4>
          No answers were found.
        </h4>
      </Grid>
    );
  }
  renderAnswers() {
    // const showOtherQuestions = this.props.otherQuestions.length > 0;
    // const showOtherAnswersets = this.props.otherQuestions.length > 0;
    const { message } = this.props.store;
    return (
      <div style={this.props.style}>
        {!this.props.omitHeader &&
        <Row>
          <Col md={12}>
            <QuestionHeader
              question={this.props.question}
              answerset={message}

              enableQuestionSelect={this.props.enableQuestionSelect}
              enableQuestionEdit={this.props.enableQuestionEdit}
              callbackUpdate={this.props.callbackQuestionUpdateMeta}
              callbackQuestionSelect={this.props.callbackQuestionSelect}
              urlQuestion={this.props.urlQuestion}

              callbackAnswersetSelect={this.props.callbackAnswersetSelect}
              urlAnswerset={this.props.urlAnswerset}

              showDownload
              callbackDownload={this.onDownload}
            />
          </Col>
        </Row>
        }
        <SimpleQuestionGraph
          store={this.props.store}
          concepts={this.props.concepts}
        />
        <Tabs
          activeKey={this.state.tabKey}
          onSelect={this.handleTabSelect}
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
              concepts={this.props.concepts}
              // callbackAnswerSelected={this.props.callbackAnswerSelected}
              store={this.props.store}
            />
          </Tab>
          <Tab
            eventKey={answerSetTabEnum.aggregate}
            title="Aggregate Graph"
          >
            <AnswersetGraph
              concepts={this.props.concepts}
              store={this.props.store}
            />
          </Tab>
        </Tabs>
      </div>
    );
  }
  render() {
    const { message } = this.props.store;
    const hasAnswers = message.answers && Array.isArray(message.answers) && message.answers.length > 0;
    return (
      <div>
        {!hasAnswers && this.renderNoAnswers()}
        {hasAnswers && this.renderAnswers()}
      </div>
    );
  }
}


MessageAnswersetPres.defaultProps = {
  enableUrlChange: false,
  enableQuestionSelect: false,
  enableFeedbackSubmit: false,
  enableFeedbackView: false,

  omitHeader: false,
  question: {},

  callbackNoAnswerSelected: () => {},
  callbackAnswerSelected: () => {},
  callbackAnswersetSelect: () => {},
  callbackQuestionSelect: () => {},
  callbackFeedbackSubmit: () => {},
  callbackQuestionUpdateMeta: () => {},
  urlQuestion: () => {},
  urlAnswerset: () => {},

  otherQuestions: [],
  otherAnswersets: [],

  answerId: [],
  answersetGraph: { nodes: [], edges: [] },

  enabledAnswerLink: false,
  getAnswerUrl: () => '',

  style: {},
};

MessageAnswersetPres.propTypes = {
  enableUrlChange: PropTypes.bool,
  enableQuestionSelect: PropTypes.bool,
  enableFeedbackSubmit: PropTypes.bool,
  enableFeedbackView: PropTypes.bool,

  omitHeader: PropTypes.bool,

  callbackNoAnswerSelected: PropTypes.func,
  callbackAnswerSelected: PropTypes.func,
  callbackAnswersetSelect: PropTypes.func,
  callbackQuestionSelect: PropTypes.func,
  callbackFeedbackSubmit: PropTypes.func,
  urlQuestion: PropTypes.func,
  urlAnswerset: PropTypes.func,

  // otherQuestions: PropTypes.arrayOf(PropTypes.object),
  // otherAnswersets: PropTypes.arrayOf(PropTypes.object),

  answerId: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),

  user: PropTypes.object.isRequired,
  question: PropTypes.object,

  message: PropTypes.shape({
    question_graph: PropTypes.shape({
      nodes: PropTypes.arrayOf(PropTypes.object),
      edges: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    knowledge_graph: PropTypes.shape({
      nodes: PropTypes.arrayOf(PropTypes.object),
      edges: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    answers: PropTypes.arrayOf(PropTypes.shape({
      edge_bindings: PropTypes.object.isRequired,
      node_bindings: PropTypes.object.isRequired,
      score: PropTypes.number,
    })).isRequired, // ISO Timestamp
  }).isRequired,

  // answers: PropTypes.arrayOf(PropTypes.object).isRequired,
  // answersetGraph: PropTypes.shape({
  //   nodes: PropTypes.arrayOf(PropTypes.object),
  //   edges: PropTypes.arrayOf(PropTypes.object),
  // }),

  enabledAnswerLink: PropTypes.bool,
  getAnswerUrl: PropTypes.func,

  style: PropTypes.object,
};

export default MessageAnswersetPres;
