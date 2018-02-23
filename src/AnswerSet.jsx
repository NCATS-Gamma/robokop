import React from 'react';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';
import AnswersetPres from './components/answerset/AnswersetPres';

class Answerset extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      user: {},
      answerset: {},
      answers: [],
      answerCount: null,
      answersetGraph: {},
      answersetFeedback: [],
    };
  }

  componentDidMount() {
    this.appConfig.answersetData(this.props.id, data => this.setState({
      user: data.user,
      answerset: data.answerset,
      answers: data.answers,
      answerCount: data.answer_num,
      answersetGraph: data.answerset_graph,
      answersetFeedback: data.answerset_feedback,
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
        <AnswersetPres
          answerset={this.state.answerset}
          answers={this.state.answers}
          answerCount={this.state.answerCount}
          answersetGraph={this.state.answersetGraph}
          answersetFeedback={this.state.answersetFeedback}
          answerUrlFunc={(answerset, answer) => this.appConfig.urls.answer(answerset.id, answer.id)}
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

export default Answerset;
