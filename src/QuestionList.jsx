import React from 'react';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import QuestionListTable from './components/QuestionListTable';

class QuestionList extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      timestamp: null,
      user: {},
      questions: [{ name: 'Question Name', id: 'undefined' }],
    };

    this.onQuestionRowClick = this.onQuestionRowClick.bind(this);
  }

  componentDidMount() {
    this.appConfig.questionListData(data => this.setState({
      timestamp: data.timestamp,
      user: data.user,
      questions: data.questions,
      ready: true,
    }));
  }

  onQuestionRowClick(question) {
    window.open(this.appConfig.urls.question(question.id), '_self');
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
        <QuestionListTable
          questions={this.state.questions}
          callbackRowClick={this.onQuestionRowClick}
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
