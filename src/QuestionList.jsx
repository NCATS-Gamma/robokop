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
      ready: false,
      user: {},
      questions: [{ name: 'Question Name', id: 'undefined' }],
    };
  }

  componentDidMount() {
    this.appConfig.questionListData(data => this.setState({
      user: data.user,
      questions: data.questions,
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
          questionUrlFunc={q => this.appConfig.urls.question(q.id)}
          questions={this.state.questions}
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
