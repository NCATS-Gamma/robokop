import React from 'react';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import QuestionListPres from './components/questionList/QuestionListPres';

class QuestionList extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      user: {},
      userQuestions: [],
      questions: [],
    };
  }

  componentDidMount() {
    this.appConfig.questionListData(data => this.setState({
      userQuestions: data.user_questions,
      questions: data.questions,
      dataReady: true,
    }));
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
  }

  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <QuestionListPres
          loginUrl={this.appConfig.urls.login}
          questionNewUrl={this.appConfig.urls.questionDesign}
          questionUrlFunc={q => this.appConfig.urls.question(q.id)}
          userQuestions={this.state.userQuestions}
          questions={this.state.questions}
          user={this.state.user}
        />
      </div>
    );
  }
  render() {
    const ready = this.state.dataReady && this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default QuestionList;
