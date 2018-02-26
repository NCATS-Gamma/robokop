import React from 'react';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import QuestionListPres from './components/questionList/QuestionListPres';


// "hash": "2af47219dcc4b2e9042afe998e1517ad", 
// "id": "Query1_Alkaptonuria_cdw_chemotext2_chemotext", 
// "name": "Question 1: Alkaptonuria", 
// "natural_question": "What genetic condition provides protection against Alkaptonuria?",
// "notes": "This is where notes go.", 
// nonuser_questions
// user_questions

class QuestionList extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      user: {},
      userQuestions: [],
      nonuserQuestions: [],
    };
  }

  componentDidMount() {
    this.appConfig.questionListData(data => this.setState({
      user: this.appConfig.ensureUser(data.user),
      userQuestions: data.user_questions,
      nonuserQuestions: data.nonuser_questions,
      ready: true,
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
          questionNewUrl={this.appConfig.urls.questionNew}
          questionUrlFunc={q => this.appConfig.urls.question(q.id)}
          userQuestions={this.state.userQuestions}
          nonuserQuestions={this.state.nonuserQuestions}
          user={this.state.user}
        />
      </div>
    );
  }
  render() {
    return (
      <div>
        {!this.state.ready && this.renderLoading()}
        {this.state.ready && this.renderLoaded()}
      </div>
    );
  }
}

export default QuestionList;
