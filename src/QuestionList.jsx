import React from 'react';
import { Grid } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import QuestionListPres from './components/questionList/QuestionListPres';

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
    };

    this.callbackQuestionNew = this.callbackQuestionNew.bind(this);
    this.renderError = this.renderError.bind(this);
  }

  componentDidMount() {
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
    this.appConfig.questionList(
      (data) => {
        console.log(data)
        this.setState({ questions: data.data.questions, dataReady: true });
      },
      (err) => {
        console.log(err);
        this.setState({ hadError: true, dataReady: false });
      },
    );
  }
  callbackQuestionNew() {
    this.appConfig.redirect(this.appConfig.urls.questionDesign);
  }
  renderLoadingUser() {
    return (
      <p />
    );
  }
  renderError() {
    return (
      <h2>
        There was a problem contacting the server.
      </h2>
    );
  }
  renderLoadedUser() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        {!this.state.dataReady && !this.state.hadError &&
          <Loading />
        }
        {!this.state.dataReady && this.state.hadError &&
          this.renderError()
        }
        {this.state.dataReady &&
          <Grid>
            <QuestionListPres
              loginUrl={this.appConfig.urls.login}
              callbackQuestionNew={this.callbackQuestionNew}
              callbackAnswersetSelect={(q, a) => this.appConfig.open(this.appConfig.urls.answerset(q.id, a.id))}
              callbackQuestionSelect={q => this.appConfig.open(this.appConfig.urls.question(q.id))}
              questions={this.state.questions}
              user={this.state.user}
            />
          </Grid>
        }
        <Footer config={this.props.config} />
      </div>
    );
  }
  render() {
    const ready = this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoadingUser()}
        {ready && this.renderLoadedUser()}
      </div>
    );
  }
}

export default QuestionList;
