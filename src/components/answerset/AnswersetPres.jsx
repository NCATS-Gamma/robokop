import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Tabs, Tab } from 'react-bootstrap';
import QuestionHeader from '../shared/QuestionHeader';
import AnswersetList from './AnswersetList';
import AnswersetInteractive from './AnswersetInteractive';
import AnswersetGraph from './AnswersetGraph';

class AnswersetPres extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: 1,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.onDownload = this.onDownload.bind(this);
  }
  onDownload() {
    console.log('Not finished yet.');
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

  render() {
    const showOtherQuestions = this.props.otherQuestions.length > 0;
    const showOtherAnswersets = this.props.otherQuestions.length > 0;

    return (
      <Grid>
        <QuestionHeader
          question={this.props.question}
          answerset={this.props.answerset}

          showOtherQuestions={showOtherQuestions}
          otherQuestions={this.props.otherQuestions}
          enableQuestionSelect={this.props.enableQuestionSelect}
          callbackQuestionSelect={this.props.callbackQuestionSelect}

          showOtherAnswersets={showOtherAnswersets}
          otherAnswersets={this.props.otherAnswersets}
          callbackAnswersetSelect={this.props.callbackAnswersetSelect}

          showDownload={this.showDownload}
          callbackDownload={this.onDownload}
        />
        <br />
        <Tabs
          activeKey={this.state.tabKey}
          onSelect={this.handleTabSelect}
          animation
          id="answerset_tabs"
          mountOnEnter
        >
          <Tab
            eventKey={1}
            title="Answers List"
          >
            <AnswersetList
              user={this.props.user} // Needed to parse feedback to know what is yours
              answers={this.props.answers}
              feedback={this.props.answersetFeedback}
              answerId={this.props.answerId} // Monitored for select by parameter or page load

              enableUrlChange={this.props.enableUrlChange}
              enableFeedbackSubmit={this.props.enableFeedbackSubmit}

              callbackAnswerSelected={this.props.callbackAnswerSelected}
              callbackNoAnswerSelected={this.props.callbackNoAnswerSelected}
              callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
              enabledAnswerLink={this.props.enabledAnswerLink}
              getAnswerUrl={this.props.getAnswerUrl}
            />
          </Tab>
          <Tab
            eventKey={2}
            title="Interactive Selector"
          >
            <AnswersetInteractive
              user={this.props.user} // Needed to parse feedback to know what is yours
              answers={this.props.answers}
              feedback={this.props.answersetFeedback}
              answerId={this.props.answerId} // Monitored for select by parameter or page load

              enableFeedbackSubmit={this.props.enableFeedbackSubmit}

              callbackAnswerSelected={this.props.callbackAnswerSelected}
              callbackNoAnswerSelected={this.props.callbackNoAnswerSelected}
              callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
              enabledAnswerLink={this.props.enabledAnswerLink}
              getAnswerUrl={this.props.getAnswerUrl}
            />
          </Tab>
          <Tab
            eventKey={3}
            title="Aggregate Graph"
          >
            <AnswersetGraph
              answersetGraph={this.props.answersetGraph}
            />
          </Tab>

        </Tabs>
      </Grid>
    );
  }
}


AnswersetPres.defaultProps = {
  enableUrlChange: false,
  enableQuestionSelect: false,
  enableFeedbackSubmit: false,

  callbackNoAnswerSelected: () => {},
  callbackAnswerSelected: () => {},
  callbackAnswersetSelect: () => {},
  callbackQuestionSelect: () => {},
  callbackFeedbackSubmit: () => {},

  otherQuestions: [],
  otherAnswersets: [],

  answerId: [],
  answersetGraph: { nodes: [], edges: [] },

  enabledAnswerLink: false,
  getAnswerUrl: () => '',
};

AnswersetPres.propTypes = {
  enableUrlChange: PropTypes.bool,
  enableQuestionSelect: PropTypes.bool,
  enableFeedbackSubmit: PropTypes.bool,

  callbackNoAnswerSelected: PropTypes.func,
  callbackAnswerSelected: PropTypes.func,
  callbackAnswersetSelect: PropTypes.func,
  callbackQuestionSelect: PropTypes.func,
  callbackFeedbackSubmit: PropTypes.func,

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
};

export default AnswersetPres;
