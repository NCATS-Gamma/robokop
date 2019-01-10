import React from 'react';

import { Grid, Row, Col, Button } from 'react-bootstrap';
import { Query } from 'react-apollo';
import { gql } from 'apollo-boost';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import AnswersetPres from './components/answerset/AnswersetPres';

const shortid = require('shortid');
const _ = require('lodash');

const QUERY_ANSWERSET_BY_IDS = (qid, aid) => gql`
{
  question: questionById(id: "${qid}") {
    id
    question_graph: qgraphByQgraphId {
      answersets: answersetsByQgraphIdList(condition: {id: "${aid}"} ) {
        id
        timestamp
        answers: answersByAnswersetIdAndQgraphIdList {
          id
          body
        }
      }
    }
  }
}
`;

class Answerset extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      conceptsReady: false,
      user: {},
      answerCount: null,
      answersetGraph: {},
      answersetFeedback: [],
      answersetId: '',
      questionId: '',
      answerId: [],
      concepts: [],
    };

    this.callbackFeedbackSubmit = this.callbackFeedbackSubmit.bind(this);
    this.handleAnswerSelect = this.handleAnswerSelect.bind(this);
    this.handleNoAnswerSelect = this.handleNoAnswerSelect.bind(this);
  }

  componentDidMount() {
    // makes the appropriate GET request from server.py,
    // uses the result to set this.state
    // this.appConfig.answersetData(
    //   this.props.id,
    //   (data) => {
    //     const answers = _.cloneDeep(data.answerset.result_list);

    //     answers.forEach((a) => {
    //       a.result_graph.edge_list.forEach((edge) => {
    //         if (!('id' in edge)) {
    //           edge.id = `${edge.provided_by}(${edge.source_id}-(${edge.type})->${edge.target_id})`;
    //         }
    //       });
    //     });

    //     const nodesIdSet = new Set();
    //     const edgesIdSet = new Set();
    //     // Parse answerset specific graph here
    //     // For each answer find new nodes and edges that haven't already been added
    //     const nodes = [];
    //     const edges = [];
    //     answers.forEach((a) => {
    //       const g = a.result_graph;
    //       g.node_list.forEach((node) => {
    //         if (!nodesIdSet.has(node.id)) {
    //           nodesIdSet.add(node.id);
    //           nodes.push(node);
    //         }
    //       });
    //       g.edge_list.forEach((edge) => {
    //         const edgeId = edge.id;
    //         if (!edgesIdSet.has(edgeId)) {
    //           edgesIdSet.add(edgeId);
    //           edges.push(edge);
    //         }
    //       });
    //     });
    //     // Package
    //     const answersetGraph = { node_list: nodes, edge_list: edges };

    //     this.setState({
    //       question: data.question,
    //       answerset: data.answerset,
    //       answers,
    //       answerCount: data.answer_num,
    //       answersetGraph,
    //       answersetFeedback: data.feedback,
    //       otherAnswersets: data.other_answersets,
    //       otherQuestions: data.other_questions,
    //       dataReady: true,
    //       isValid: true,
    //       answerId: this.props.answerId,
    //     });
    //   },
    //   (err) => {
    //     console.log(err);
    //     this.setState({
    //       dataReady: true,
    //       isValid: false,
    //     });
    //   }
    // );
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

  componentWillReceiveProps(nextProps) {
    const subIds = nextProps.id.split('_');
    this.setState({ questionId: subIds[0], answersetId: subIds[1] })
  }

  parseAnswersetInfo(data) {
    //     const answers = _.cloneDeep(data.answerset.result_list);

    //     answers.forEach((a) => {
    //       a.result_graph.edge_list.forEach((edge) => {
    //         if (!('id' in edge)) {
    //           edge.id = `${edge.provided_by}(${edge.source_id}-(${edge.type})->${edge.target_id})`;
    //         }
    //       });
    //     });

    //     const nodesIdSet = new Set();
    //     const edgesIdSet = new Set();
    //     // Parse answerset specific graph here
    //     // For each answer find new nodes and edges that haven't already been added
    //     const nodes = [];
    //     const edges = [];
    //     answers.forEach((a) => {
    //       const g = a.result_graph;
    //       g.node_list.forEach((node) => {
    //         if (!nodesIdSet.has(node.id)) {
    //           nodesIdSet.add(node.id);
    //           nodes.push(node);
    //         }
    //       });
    //       g.edge_list.forEach((edge) => {
    //         const edgeId = edge.id;
    //         if (!edgesIdSet.has(edgeId)) {
    //           edgesIdSet.add(edgeId);
    //           edges.push(edge);
    //         }
    //       });
    //     });
    //     // Package
    //     const answersetGraph = { node_list: nodes, edge_list: edges };

    //     this.setState({
    //       question: data.question,
    //       answerset: data.answerset,
    //       answers,
    //       answerCount: data.answer_num,
    //       answersetGraph,
    //       answersetFeedback: data.feedback,
    //       otherAnswersets: data.other_answersets,
    //       otherQuestions: data.other_questions,
    //       dataReady: true,
    //       isValid: true,
    //       answerId: this.props.answerId,
    //     });

    const question = {};
    const answerset = {};
    const answers = [];
    const answerCount = [];
    const answersetGraph = {};
    return {
      question,
      answerset,
      answers,
      answerCount,
      answersetGraph,
    };
  }

  callbackFeedbackSubmit(newPartialFeedback) {
    const newFeedback = { ...newPartialFeedback, ...{ question_id: this.state.questionId, answerset_id: this.state.answersetId } };
    // Set this.props.answerFeedback
    console.log(newFeedback);

    this.appConfig.answerFeedbackNew(
      newFeedback,
      () => {
        this.appConfig.answerFeedback(
          this.state.questionId,
          this.state.answersetId,
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
    this.appConfig.replaceUrl('Robokop - Answers', this.appConfig.urls.answer(this.state.questionId, this.state.answersetId, answer.id));
    // this.setState({ answerId: answer.id });
  }
  handleNoAnswerSelect() {
    this.appConfig.replaceUrl('Robokop - Answers', this.appConfig.urls.answerset(this.state.questionId, this.state.answersetId));
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
  renderLoadedUser() {
    const isAuth = this.state.user.is_authenticated;
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Query query={QUERY_GET_QUESTION_BY_ID(this.props.id)}>
          {({ loading, error, data }) => {
            if (loading) {
              // console.log('GraphQL is loading');
              return <Loading />;
            }

            if (error) {
              console.log('GraphQL error:', error);
              return this.renderInvalid();
            }
            // Good response
            // console.log('GraphQL data:', data);
            const parsedData = parseAnswersetInfo(data);

            const { question } = data;
            question.machine_question = JSON.parse(question.machine_question.body);
            const { answersets } = question.question_graph;

            return (
              <Grid>
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
                    concepts={this.state.concepts}
                    otherQuestions={this.state.otherQuestions}
                    otherAnswersets={this.state.otherAnswersets}
                    enableUrlChange
                    enableQuestionSelect
                    enableFeedbackSubmit={isAuth}
                    enableFeedbackView={isAuth}
                    callbackAnswersetSelect={a => this.appConfig.redirect(this.appConfig.urls.answerset(this.state.questionId, a.id))}
                    callbackQuestionSelect={q => this.appConfig.redirect(this.appConfig.urls.question(q.id))}
                    callbackAnswerSelected={this.handleAnswerSelect}
                    urlQuestion={q => this.appConfig.urls.question(q.id)}
                    urlAnswerset={a => this.appConfig.urls.answerset(this.state.questionId, a.id)}
                    callbackNoAnswerSelected={this.handleNoAnswerSelect}
                    enabledAnswerLink
                    getAnswerUrl={answer => this.appConfig.urls.answer(this.state.questionId, this.state.answersetId, answer.id)}
                    callbackFeedbackSubmit={this.callbackFeedbackSubmit}
                  />
                }
              </Grid>
            );
          }}
        </Query>
        
        <Footer config={this.props.config} />
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
