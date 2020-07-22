import React from 'react';
import { Grid } from 'react-bootstrap';
import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import QuestionListPres from './components/questionList/QuestionListPres';
import TasksModal from './components/shared/modals/TasksModal';

import './quesitonlist.css';

class QuestionList extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      dataReady: false,
      user: {},
      questions: [],
      hadError: false,
      question: {},
      showModal: false,
    };

    this.callbackTaskStop = this.callbackTaskStop.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.callbackQuestionNew = this.callbackQuestionNew.bind(this);
    this.simpleQuestion = this.simpleQuestion.bind(this);
    this.sortTasks = this.sortTasks.bind(this);
  }

  componentDidMount() {
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
    this.appConfig.questionList(
      (data) => {
        this.setState({ questions: data.data.questions, dataReady: true });
      },
      (err) => {
        console.log(err);
        this.setState({ hadError: true, dataReady: false });
      },
    );
  }

  callbackTaskStop(question) {
    this.setState({ question }, () => {
      this.toggleModal();
    });
  }

  toggleModal() {
    this.setState(prevState => ({ showModal: !prevState.showModal }));
  }

  sortTasks(tasks) {
    if (tasks) {
      return tasks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return [];
  }

  callbackQuestionNew() {
    this.appConfig.redirect(this.appConfig.urls.questionDesign);
  }

  simpleQuestion() {
    this.appConfig.redirect(this.appConfig.urls.simpleQuestion);
  }

  render() {
    const ready = this.state.userReady;
    return (
      <div>
        {ready ?
          <div>
            <Header
              config={this.props.config}
              user={this.state.user}
            />
            {!this.state.dataReady && !this.state.hadError &&
              <Loading />
            }
            {!this.state.dataReady && this.state.hadError &&
              <h2>
                There was a problem contacting the server.
              </h2>
            }
            {this.state.dataReady &&
              <Grid>
                <QuestionListPres
                  loginUrl={this.appConfig.urls.login}
                  callbackQuestionNew={this.callbackQuestionNew}
                  simpleQuestion={this.simpleQuestion}
                  callbackAnswersetSelect={(q, a) => this.appConfig.open(this.appConfig.urls.answerset(q.id, a.id))}
                  callbackQuestionSelect={q => this.appConfig.open(this.appConfig.urls.question(q.id))}
                  questions={this.state.questions}
                  user={this.state.user}
                  onClick={this.callbackTaskStop}
                />
              </Grid>
            }
            <Footer config={this.props.config} />
            <TasksModal header={this.state.question.naturalQuestion} tasks={this.sortTasks(this.state.question.tasks)} user={this.state.user} showModal={this.state.showModal} toggleModal={this.toggleModal} />
          </div>
          :
          <p />
        }
      </div>
    );
  }
}

export default QuestionList;
