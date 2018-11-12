import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Tabs, Tab } from 'react-bootstrap';
import QuestionHeader from '../shared/QuestionHeader';
import AnswersetList from './AnswersetList';
import AnswersetInteractive from './AnswersetInteractive';
import AnswersetGraph from './AnswersetGraph';
import AnswersetTable from './AnswersetTable';
import AnswersetStore from './../../stores/answersetStore';

export const answerSetTabEnum = {
  answerList: 1,
  interactive: 2,
  aggregate: 3,
  answerTable: 4,
};

class AnswersetPres extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: answerSetTabEnum.answerList,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.onDownload = this.onDownload.bind(this);
    this.renderNoAnswers = this.renderNoAnswers.bind(this);
    this.renderAnswers = this.renderAnswers.bind(this);

    this.answersetStore = new AnswersetStore(this.props.answers);
  }
  onDownload() {
    const data = this.props.answerset;

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
    const showOtherQuestions = this.props.otherQuestions.length > 0;
    const showOtherAnswersets = this.props.otherQuestions.length > 0;

    return (
      <div style={this.props.style}>
        {!this.props.omitHeader &&
        <div>
          <QuestionHeader
            question={this.props.question}
            answerset={this.props.answerset}

            showOtherQuestions={showOtherQuestions}
            otherQuestions={this.props.otherQuestions}
            enableQuestionSelect={this.props.enableQuestionSelect}
            callbackQuestionSelect={this.props.callbackQuestionSelect}
            urlQuestion={this.props.urlQuestion}

            showOtherAnswersets={showOtherAnswersets}
            otherAnswersets={this.props.otherAnswersets}
            callbackAnswersetSelect={this.props.callbackAnswersetSelect}
            urlAnswerset={this.props.urlAnswerset}

            showDownload
            callbackDownload={this.onDownload}
          />
          <br />
        </div>
        }
        <Tabs
          activeKey={this.state.tabKey}
          onSelect={this.handleTabSelect}
          animation
          id="answerset_tabs"
          mountOnEnter
        >
          <Tab
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
          </Tab>
          <Tab
            eventKey={answerSetTabEnum.answerTable}
            title="Answers Table"
          >
            <AnswersetTable
              answersetGraph={this.props.answersetGraph}
              answers={this.props.answers}
              concepts={this.props.concepts}
              callbackAnswerSelected={this.props.callbackAnswerSelected}
              store={this.answersetStore}
              handleTabSelect={this.handleTabSelect}
            />
          </Tab>
          <Tab
            eventKey={answerSetTabEnum.interactive}
            title="Interactive Selector"
          >
            <AnswersetInteractive
              user={this.props.user} // Needed to parse feedback to know what is yours
              answers={this.props.answers}
              answersetFeedback={this.props.answersetFeedback}
              answerId={this.props.answerId} // Monitored for select by parameter or page load
              concepts={this.props.concepts}

              enableFeedbackSubmit={this.props.enableFeedbackSubmit}
              enableFeedbackView={this.props.enableFeedbackView}

              callbackAnswerSelected={this.props.callbackAnswerSelected}
              callbackNoAnswerSelected={this.props.callbackNoAnswerSelected}
              callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
              enabledAnswerLink={this.props.enabledAnswerLink}
              getAnswerUrl={this.props.getAnswerUrl}
            />
          </Tab>
          <Tab
            eventKey={answerSetTabEnum.aggregate}
            title="Aggregate Graph"
          >
            <AnswersetGraph
              answersetGraph={this.props.answersetGraph}
              concepts={this.props.concepts}
            />
          </Tab>
        </Tabs>
      </div>
    );
  }
  render() {
    const hasAnswers = Array.isArray(this.props.answers) && this.props.answers.length > 0;
    return (
      <div>
        {!hasAnswers && this.renderNoAnswers()}
        {hasAnswers && this.renderAnswers()}
      </div>
    );
  }
}


AnswersetPres.defaultProps = {
  enableUrlChange: false,
  enableQuestionSelect: false,
  enableFeedbackSubmit: false,
  enableFeedbackView: false,

  omitHeader: false,

  callbackNoAnswerSelected: () => {},
  callbackAnswerSelected: () => {},
  callbackAnswersetSelect: () => {},
  callbackQuestionSelect: () => {},
  callbackFeedbackSubmit: () => {},
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

AnswersetPres.propTypes = {
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

  otherQuestions: PropTypes.arrayOf(PropTypes.object),
  otherAnswersets: PropTypes.arrayOf(PropTypes.object),

  answerId: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),

  user: PropTypes.object.isRequired,
  question: PropTypes.shape({
    color: PropTypes.string,
    fontSize: PropTypes.number
  }).isRequired,
  answerset: PropTypes.shape({
    creator: PropTypes.string,
    timestamp: PropTypes.string, // ISO Timestamp
  }).isRequired,

  answers: PropTypes.arrayOf(PropTypes.object).isRequired,
  answersetGraph: PropTypes.shape({
    nodes: PropTypes.arrayOf(PropTypes.object),
    edges: PropTypes.arrayOf(PropTypes.object),
  }),

  enabledAnswerLink: PropTypes.bool,
  getAnswerUrl: PropTypes.func,

  style: PropTypes.object,
};

export default AnswersetPres;
