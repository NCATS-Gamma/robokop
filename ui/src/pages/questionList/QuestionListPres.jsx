import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';

import QuestionListTableAgGrid from './QuestionListTableAgGrid';

import runningTaskFilter from '../util/runningTaskFilter';

class QuestionListPres extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      questions: [{}],
    };

    this.syncStateAndProps = this.syncStateAndProps.bind(this);
    this.getTableHeight = this.getTableHeight.bind(this);
  }
  componentDidMount() {
    this.syncStateAndProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.syncStateAndProps(nextProps);
  }

  getTableHeight() {
    let h = window.innerHeight - 300;
    if (h < 300) {
      h = 300;
    }
    return `${h}px`;
  }

  syncStateAndProps(newProps) {
    if (newProps.questions === null) {
      this.setState({ questions: [] });
      return;
    }
    const questions = newProps.questions.map((question) => {
      const q = question;
      q.isUserOwned = q.ownerId === this.props.user.user_id;
      q.hasAnswerset = false; // Boolean(q.latest_answerset_id);

      const answersets = ('qgraphs' in q && 'answersets' in q.qgraphs && Array.isArray(q.qgraphs.answersets)) ? q.qgraphs.answersets : [];

      if (answersets.length > 0) {
        const answersetDates = answersets.map((a) => {
          let ts = a.timestamp;
          if (!ts.endsWith('Z')) {
            ts = `${ts}Z`;
          }
          return new Date(ts);
        });

        const inds = Array.apply(null, Array(answersetDates.length)).map(() => {}); // eslint-disable-line
        const sortingInds = (inds).map((v, i) => i);
        sortingInds.sort((a, b) => (answersetDates[b] - answersetDates[a]));
        const answersetsSorted = sortingInds.map(v => answersets[v]);

        q.hasAnswerset = true;
        q.latestAnswersetId = answersetsSorted[0].id;
      } else {
        q.hasAnswerset = false;
        q.latestAnswersetId = '';
      }

      const qRunningTasks = Array.isArray(q.tasks) ? q.tasks.filter(runningTaskFilter) : [];
      q.isBusy = qRunningTasks.length > 0;
      return q;
    });

    // Move the user owned questions to the top
    const questionsSorted = questions.filter(q => q.isUserOwned).concat(questions.filter(q => !q.isUserOwned));

    this.setState({ questions: questionsSorted });
  }

  render() {
    const isAuth = this.props.user.is_authenticated;
    const nUserQuestions = this.state.questions.reduce((n, q) => (n + q.isUserOwned), 0);
    const hasUserQuestions = nUserQuestions > 0;

    const showLogIn = !isAuth;
    const showMyQuestionsEmpty = isAuth && !hasUserQuestions;
    const tableHeight = this.getTableHeight();
    const nQuestions = this.state.questions.length;
    return (
      <div>
        <Row>
          <Col md={12}>
            <h1>
              Robokop Question Library
              <br />
              <small>
                {nQuestions} questions have been asked using Robokop.
              </small>
            </h1>
          </Col>
          <Col md={12}>
            {showLogIn &&
              <div style={{ marginBottom: '20px' }}>
                <p style={{ display: 'inline-block', marginRight: '20px' }}>
                  You aren&apos;t signed in. Please <a href={this.props.loginUrl}>Sign In</a> to save your questions.
                </p>
                <Button bsStyle="default" onClick={this.props.simpleQuestion}>
                  Ask a Quick Question
                </Button>
              </div>
            }
            {!showLogIn && showMyQuestionsEmpty &&
              <div>
                <p>
                  {"You don't seem to have any questions of your own yet."}
                </p>
                <Button bsStyle="default" onClick={this.props.callbackQuestionNew}>
                  Ask a Question
                </Button>
                <br />
                <br />
              </div>
            }
            <QuestionListTableAgGrid
              questions={this.state.questions}
              showSearch
              callbackAnswersetSelect={this.props.callbackAnswersetSelect}
              callbackQuestionSelect={this.props.callbackQuestionSelect}
              height={tableHeight}
              onClick={this.props.onClick}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

// Props - Future Validation
// questionNewUrl - string url
// questionUrlFunc - function that takes a question and returns the url
// userQuestions - array of questions owned by this user
// questions - array of questions

export default QuestionListPres;
