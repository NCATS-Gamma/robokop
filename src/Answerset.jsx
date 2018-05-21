import React from 'react';

import { Grid, Row, Col, Button } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';
import AnswersetPres from './components/answerset/AnswersetPres';

const shortid = require('shortid');
const _ = require('lodash');

class Answerset extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      conceptsReady: false,
      isValid: false,
      user: {},
      answerset: {},
      answers: [],
      answerCount: null,
      answersetGraph: {},
      answersetFeedback: [],
      answerId: [],
    };

    this.callbackFeedbackSubmit = this.callbackFeedbackSubmit.bind(this);
    this.handleAnswerSelect = this.handleAnswerSelect.bind(this);
    this.handleNoAnswerSelect = this.handleNoAnswerSelect.bind(this);
  }

  componentDidMount() {
    // makes the appropriate GET request from server.py,
    // uses the result to set this.state
    this.appConfig.answersetData(
      this.props.id,
      (data) => {
        const answers = _.cloneDeep(data.answerset.result_list);
        answers.forEach((a) => {
          a.result_graph.edge_list.forEach((e) => {
            if (!('id' in e)) {
              e.id = shortid.generate();
            }
          });
        });

        const nodesIdSet = new Set();
        const edgesIdSet = new Set();
        // Parse answerset specific graph here
        // For each answer find new nodes and edges that haven't already been added
        const nodes = [];
        const edges = [];
        answers.forEach((a) => {
          const g = a.result_graph;
          g.node_list.forEach((node) => {
            if (!nodesIdSet.has(node.id)) {
              nodesIdSet.add(node.id);
              nodes.push(node);
            }
          });
          g.edge_list.forEach((edge) => {
            const edgeId = `${edge.source_id} ${edge.target_id}`;
            if (!edgesIdSet.has(edgeId)) {
              edgesIdSet.add(edgeId);
              edges.push(edge);
            }
          });
        });
        // Package
        const answersetGraph = { node_list: nodes, edge_list: edges };

        this.setState({
          question: data.question,
          answerset: data.answerset,
          answers,
          answerCount: data.answer_num,
          answersetGraph,
          answersetFeedback: data.feedback,
          otherAnswersets: data.other_answersets,
          otherQuestions: data.other_questions,
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
      }
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

  callbackFeedbackSubmit(newPartialFeedback) {
    const newFeedback = { ...newPartialFeedback, ...{ question_id: this.state.question.id } };
    console.log(newFeedback);

    this.appConfig.answerFeedback(
      newFeedback,
      () => {}, // All good
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
    this.setState({ answerId: answer.id });
  }
  handleNoAnswerSelect() {
    this.appConfig.replaceUrl('Robokop - Answers', this.appConfig.urls.answerset(this.state.question.id, this.state.answerset.id));
    this.setState({ answerId: [] });
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
    const isAuth = this.state.user.is_authenticated;
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
            user={this.state.user}
            question={this.state.question}
            answerset={this.state.answerset}
            answerId={this.state.answerId}
            answers={this.state.answers}
            answerCount={this.state.answerCount}
            answersetGraph={this.state.answersetGraph}
            answersetFeedback={this.state.answersetFeedback}
            otherQuestions={this.state.otherQuestions}
            otherAnswersets={this.state.otherAnswersets}
            enableUrlChange
            enableQuestionSelect
            enableFeedbackSubmit={false}
            enableFeedbackView={false}
            callbackAnswersetSelect={a => this.appConfig.redirect(this.appConfig.urls.answerset(this.state.question.id, a.id))}
            callbackQuestionSelect={q => this.appConfig.redirect(this.appConfig.urls.question(q.id))}
            callbackAnswerSelected={this.handleAnswerSelect}
            callbackNoAnswerSelected={this.handleNoAnswerSelect}
            enabledAnswerLink
            getAnswerUrl={answer => this.appConfig.urls.answer(this.state.question.id, this.state.answerset.id, answer.id)}
            callbackFeedbackSubmit={this.callbackFeedbackSubmit}
          />
        }
      </div>
    );
  }
  render() {
    const ready = this.state.dataReady && this.state.userReady && this.state.conceptsReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default Answerset;
