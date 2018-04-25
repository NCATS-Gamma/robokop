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
    // makes the appropriate GET request from server.py,
    // uses the result to set this.state
    this.appConfig.answersetData(
      this.props.questionId, 
      this.props.id, 
      data => this.setState({
        user: data.user,
        question: data.question,
        answerset: data.answerset,
        answers: data.answers,
        answerCount: data.answer_num,
        answersetGraph: data.answerset_graph,
        answersetFeedback: data.answerset_feedback,
        otherAnswersets: data.other_answersets,
        otherQuestions: data.other_questions,
        ready: true,
      }),
    );
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
          question={this.state.question}
          answerset={this.state.answerset}
          answers={this.state.answers}
          answerCount={this.state.answerCount}
          answersetGraph={this.state.answersetGraph}
          answersetFeedback={this.state.answersetFeedback}
          otherQuestions={this.state.otherQuestions}
          otherAnswersets={this.state.otherAnswersets}
          callbackAnswersetSelect={a => this.appConfig.redirect(this.appConfig.urls.answerset(this.state.question.id, a.id))}
          callbackQuestionSelect={q => this.appConfig.redirect(this.appConfig.urls.question(q.id))}
          callbackAnswerSelect={a => this.appConfig.redirect(this.appConfig.urls.answer(this.state.question.id, this.state.answerset.id, a.id))}
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
