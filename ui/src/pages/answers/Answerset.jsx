import React from 'react';

import { Grid, Row, Col, Button } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import MessageAnswersetPres from './components/answerset/MessageAnswersetPres';

import './answers.css';

const _ = require('lodash');

class Answerset extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      questionReady: false,
      userReady: false,
      conceptsReady: false,
      isValid: false,
      user: {},
      answerId: [],
      concepts: [],
      message: {},
      question: {},
      questionId: null,
      answersetFeedback: [], // Currently unused
    };

    this.callbackFeedbackSubmit = this.callbackFeedbackSubmit.bind(this);
    this.callbackQuestionUpdateMeta = this.callbackQuestionUpdateMeta.bind(this);
    this.handleAnswerSelect = this.handleAnswerSelect.bind(this);
    this.handleNoAnswerSelect = this.handleNoAnswerSelect.bind(this);
  }

  componentDidMount() {
    // makes the appropriate GET request from server.py,
    // uses the result to set this.state
    this.appConfig.answersetData(
      this.props.id,
      (data) => {
        const message = data;

        this.setState({
          message,
          dataReady: true,
          isValid: true,
          answerId: this.props.answerId,
        });
      },
      (err) => {
        console.log(err);
        this.setState({
          dataReady: true,
          isValid: false,
        });
      },
    );
    const qid = this.props.id.split('_')[0];
    this.appConfig.questionData(
      qid,
      (data) => {
        const { question } = data.data;
        if ('body' in question.machine_question) {
          question.machine_question = JSON.parse(question.machine_question.body);
        }

        this.setState({
          questionId: qid,
          question,
          questionReady: true,
        });
      },
      (err) => {
        console.log(err);
        this.setState({
          questionReady: true,
          isValid: false,
        });
      },
    );
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
    this.appConfig.concepts((data) => {
      this.setState({
        concepts: data,
        conceptsReady: true,
      });
    });
  }

  callbackQuestionUpdateMeta(newMeta, fun) {
    this.appConfig.questionUpdateMeta(this.state.questionId, newMeta, fun);
  }

  callbackFeedbackSubmit(newPartialFeedback) {
    const newFeedback = { ...newPartialFeedback, ...{ question_id: this.state.question.id, answerset_id: this.state.answerset.id } };
    // Set this.props.answerFeedback
    console.log(newFeedback);

    this.appConfig.answerFeedbackNew(
      newFeedback,
      () => {
        this.appConfig.answerFeedback(
          this.state.question.id,
          this.state.answerset.id,
          (data) => {
            this.setState({ answersetFeedback: data });
          },
          (err) => {
            window.alert('Sorry. There was a problem submitting and then fetching the feedback data to the server.');
            console.log('Problem with get request:');
            console.log(err);
          },
        );
      },
      (err) => {
        window.alert('Sorry. There was a problem submitting the feedback data to the server.');
        console.log('Problem with post request:');
        console.log(err);
      },
    );
  }
  handleAnswerSelect(answer) {
    // This creates subtle oddities between list and interactive view so it has been disabled.
    this.appConfig.replaceUrl('Robokop - Answers', this.appConfig.urls.answer(this.state.question.id, this.state.answerset.id, answer.id));
    // this.setState({ answerId: answer.id });
  }
  handleNoAnswerSelect() {
    this.appConfig.replaceUrl('Robokop - Answers', this.appConfig.urls.answerset(this.state.question.id, this.state.answerset.id));
    // this.setState({ answerId: [] });
  }
  renderLoadingUser() {
    return (
      <p />
    );
  }
  renderInvalid() {
    return (
      <div>
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
      </div>
    );
  }
  renderLoadedUser(isLoading) {
    // const isAuth = this.state.user.is_authenticated; // Previously used to enable feedback, maybe one day
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        {isLoading &&
          <Loading
            message={<p style={{ textAlign: 'center' }}>Loading Answerset</p>}
          />
        }
        {!isLoading &&
          <Grid>
            {!this.state.isValid &&
              this.renderInvalid()
            }
            {this.state.isValid &&
              <MessageAnswersetPres
                user={this.state.user}
                question={this.state.question}
                message={this.state.message}
                answerId={this.state.answerId}
                concepts={this.state.concepts}
                enableQuestionSelect
                enableQuestionEdit
                callbackQuestionUpdateMeta={this.callbackQuestionUpdateMeta}
                callbackAnswersetSelect={a => this.appConfig.redirect(this.appConfig.urls.answerset(this.state.question.id, a.id))}
                callbackQuestionSelect={q => this.appConfig.redirect(this.appConfig.urls.question(q.id))}
                urlQuestion={q => this.appConfig.urls.question(q.id)}
                urlAnswerset={a => this.appConfig.urls.answerset(this.state.question.id, a.id)}
                // callbackFeedbackSubmit={this.callbackFeedbackSubmit}
              />
            }
          </Grid>
        }
        <Footer config={this.props.config} />
      </div>
    );
  }
  render() {
    const ready = this.state.userReady && this.state.conceptsReady;
    return (
      <div>
        {!ready && this.renderLoadingUser()}
        {ready && this.renderLoadedUser(!(this.state.dataReady && this.state.questionReady))}
      </div>
    );
  }
}

export default Answerset;
