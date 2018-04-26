import React from 'react';

import { Grid, Row, Col, Button } from 'react-bootstrap';

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
      dataReady: false,
      userReady: false,
      isValid: false,
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
      this.props.id,
      data => this.setState({
        question: data.question,
        answerset: data.answerset,
        answers: data.answers,
        answerCount: data.answer_num,
        answersetGraph: data.answerset_graph,
        answersetFeedback: data.answerset_feedback,
        otherAnswersets: data.other_answersets,
        otherQuestions: data.other_questions,
        dataReady: true,
        isValid: true,
      }),
      () => this.setState({
        dataReady: true,
        isValid: false,
      }),
    );
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
  renderInvalid() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <h3>
              Unknown Answer Set
            </h3>
            <p>
              {"We're sorry but we can't find the requested answer set."}
            </p>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Button bsSize="large" href={this.appConfig.urls.questions}>
              Browse Questions
            </Button>
          </Col>
        </Row>
      </Grid>
    );
  }
  renderLoaded() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        {!this.state.isValid &&
          this.renderInvalid()
        }
        {this.state.isValid &&
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
        }
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

export default Answerset;
