import React from 'react';
import { Grid, Row, Col, Alert, Button, Panel } from 'react-bootstrap';

import QuestionListTableAgGrid from './QuestionListTableAgGrid';

class QuestionListPres extends React.Component {
  constructor(props) {
    super(props);

    this.onQuestionRowClick = this.onQuestionRowClick.bind(this);
    this.onQuestionNewClick = this.onQuestionNewClick.bind(this);
  }

  onQuestionRowClick(question) {
    window.open(this.props.questionUrlFunc(question), '_self');
  }

  onQuestionNewClick() {
    window.open(this.props.questionNewUrl, '_self');
  }

  render() {
    const isAuth = this.props.user.is_authenticated;
    const hasUserQuestions = this.props.userQuestions.length > 0;

    const showLogIn = !isAuth;
    const showMyQuestionsEmpty = isAuth && !hasUserQuestions;
    const showMyQuestionsTable = isAuth && hasUserQuestions;

    return (
      <Grid>
        <Row>
          <Col md={12}>
            {showLogIn &&
              <Alert>
                If you would like to begin asking your own questions you will need to <a href={this.props.loginUrl}>Log in</a>
              </Alert>
            }
            {!showLogIn &&
            <Panel>
              <Panel.Heading>
                <Panel.Title>
                  <b>My Questions</b>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                {showMyQuestionsEmpty &&
                  <div>
                    <h4>
                      {"You don't seem to have any questions of your own yet."}
                    </h4>
                    <Button bsStyle="default" onClick={this.onQuestionNewClick}>
                      Ask a Question
                    </Button>
                  </div>
                }
                {showMyQuestionsTable &&
                  <QuestionListTableAgGrid
                    questions={this.props.userQuestions}
                    showSearch
                    callbackRowClick={this.onQuestionRowClick}
                    height="200px"
                  />
                }
              </Panel.Body>
            </Panel>
            }
            <Panel>
              <Panel.Heading>
                <Panel.Title>
                  <b>Explore All Questions</b>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <QuestionListTableAgGrid
                  questions={this.props.questions}
                  showSearch
                  callbackRowClick={this.onQuestionRowClick}
                  height="400px"
                />
              </Panel.Body>
            </Panel>
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
