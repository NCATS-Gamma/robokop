import React from 'react';
import { Alert, Button, Panel } from 'react-bootstrap';

//import QuestionListTable from './QuestionListTable';
import QuestionListTableAgGrid from './QuestionListTableAgGrid';

class QuestionListPres extends React.Component {
  constructor(props) {
    super(props);

    this.onQuestionRowClick = this.onQuestionRowClick.bind(this);
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
      <div>
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
                showSearch={false}
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
              <b>All Questions</b>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <QuestionListTableAgGrid
              questions={this.props.nonuserQuestions}
              showSearch={true}
              callbackRowClick={this.onQuestionRowClick}
            />
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}

// Props - Future Validation
// questionUrlFunc
// userQuestions
// nonuserQuestions

export default QuestionListPres;
