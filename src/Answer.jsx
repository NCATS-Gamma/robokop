import React from 'react';

import { Grid, Row, Col, Button } from 'react-bootstrap';
import AppConfig from './AppConfig';
import Header from './components/Header';

import Loading from './components/Loading';
import AnswerPres from './components/answer/AnswerPres';

class Answer extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      isValid: false,
      user: {},
    };
  }

  componentDidMount() {
    this.appConfig.answerData(
      this.props.questionId,
      this.props.setId,
      this.props.id,
      data => this.setState({
        isValid: true,
        dataReady: true,
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
              Unknown Answer
            </h3>
            <p>
              {"We're sorry but we can't find the requested answer."}
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
          <AnswerPres
            question
            answerset
            answersetId={this.props}
            answerId={this.props.id}
            feedback={this.state.feedback}
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

export default Answer;
