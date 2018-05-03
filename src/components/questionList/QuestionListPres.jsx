import React from 'react';
import { Grid, Row, Col, Alert, Button, Panel } from 'react-bootstrap';

import QuestionListTableAgGrid from './QuestionListTableAgGrid';

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
    let h = $(window).height() - 250;
    if (h < 250) {
      h = 250;
    }
    return `${h}px`;
  }

  syncStateAndProps(newProps) {
    let questions = newProps.questions.map((q) => {
      q.isUserOwned = q.user_email === this.props.user.username;
      q.hasAnswerset = Boolean(q.latest_answerset_id);
      q.isBusy = Array.isArray(q.tasks) && q.tasks.length > 0;
      return q;
    });
    // Move the user owned questions to the top
    // questions = questions.filter(q => q.isUserOwned).concat(questions.filter(q => !q.isUserOwned));

    this.setState({ questions });
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
      <Grid>
        <Row>
          <Col md={12}>
            <h3>Robokop Question Library</h3>
            <p>
              {nQuestions} questions have been asked using Robokop.
            </p>
          </Col>
          <Col md={12}>
            {showLogIn &&
              <p>
                If you would like to begin asking your own questions you will need to <a href={this.props.loginUrl}>Log in</a>
              </p>
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
              answersetUrlFunction={this.props.answersetUrlFunction}
              callbackAnswersetSelect={this.props.callbackAnswersetSelect}
              callbackQuestionSelect={this.props.callbackQuestionSelect}
              height={tableHeight}
            />
          </Col>
        </Row>
      </Grid>
    );
  }
}

// Props - Future Validation
// questionNewUrl - string url
// questionUrlFunc - function that takes a question and returns the url
// userQuestions - array of questions owned by this user
// questions - array of questions

export default QuestionListPres;
