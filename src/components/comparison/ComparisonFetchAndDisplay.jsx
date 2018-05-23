import React from 'react';

import { Grid, Row, Col } from 'react-bootstrap';
import Loading from '../Loading';
import AnswersetPres from '../answerset/AnswersetPres';

const shortid = require('shortid');
const _ = require('lodash');

class ComparisonFetchAndDisplay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      isErrorConnect: false,
      isErrorLoad: false,
      errorMessage: '',
      question: {},
      answerset: {},
      answers: [{}],
      answersetGraph: {},
    };

    this.loadData = this.loadData.bind(this);
    this.renderLoading = this.renderLoading.bind(this);
    this.renderLoaded = this.renderLoaded.bind(this);
    this.renderValid = this.renderValid.bind(this);
    this.renderError = this.renderError.bind(this);
  }

  componentDidMount() {
    // uses the result to set this.state
    this.props.fetchFun(
      this.props.queryId,
      this.props.terms,
      data => this.loadData(data),
      err => this.setState({ isErrorConnect: true, errorMessage: err, ready: true }),
    );
  }

  loadData(object) {
    try {
      console.log(object)
      const answerset = object;
      answerset.creator = object.tool_version;
      answerset.timestamp = object.timestamp;

      const question = { // These are the required fields for our question header
        name: object.original_question_text, // This may seem backwards between name an natural but it looks better
        natural_question: object.id,
        notes: object.message, // We use the notes area to display the message
      };

      const answers = _.cloneDeep(object.result_list);
      if (!Array.isArray(answers) || (answers.length < 1)) {
        throw new Error('No answers were found.');
      }
      answers.forEach((a) => {
        const edges = a.result_graph.edge_list;
        const nodes = a.result_graph.node_list;

        if (!Array.isArray(edges) || (edges.length < 1)) {
          throw new Error('An answer has a graph with no edges.');
        }
        if (!Array.isArray(nodes) || (nodes.length < 1)) {
          throw new Error('An answer has a graph with no nodes.');
        }
      });
      answers.forEach((a) => {
        a.result_graph.edge_list.forEach((edge) => {
          if (!('id' in edge)) {
            edge.id = shortid.generate();
          }
        });
      });

      answers.forEach((a, i) => {
        const answerNodeIds = new Set();
        a.result_graph.node_list.forEach((n) => {
          if (answerNodeIds.has(n.id)) {
            console.log(`Answer ${i+1} has multiple nodes with id ${n.id}. Future errors will result.`);
          } else {
            answerNodeIds.add(n.id);
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
        question,
        answerset,
        answers,
        answersetGraph,
        ready: true,
      });
    } catch (err) {
      console.log(err);
      this.setState({ isErrorLoad: true, errorMessage: err, ready: true });
    }
  }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderValid() {
    return (
      <AnswersetPres
        user={this.props.user}
        question={this.state.question}
        answerset={this.state.answerset}
        answers={this.state.answers}
        answersetGraph={this.state.answersetGraph}
        omitHeader
      />
    );
  }
  renderError() {
    const { isErrorConnect, isErrorLoad } = this.state;
    let titleStr = 'Issues with Answer Set';
    if (isErrorConnect) {
      titleStr = 'Issues Requesting Answer Set';
    }
    if (isErrorLoad) {
      titleStr = 'Issues Intepretting Answer Set';
    }
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <h3>
              {titleStr}
            </h3>
            <h4>
              Error Message:
            </h4>
            <pre>
              {this.state.errorMessage.message}
            </pre>
          </Col>
        </Row>
      </Grid>
    );
  }
  renderLoaded() {
    const { isErrorConnect, isErrorLoad } = this.state;
    const isError = isErrorConnect || isErrorLoad;
    return (
      <div>
        {!isError && this.renderValid()}
        {isError && this.renderError()}
      </div>
    );
  }
  render() {
    const { ready } = this.state;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

ComparisonFetchAndDisplay.defaultProps = {
  name: 'Reasoner',
  terms: {},
  queryId: '',
};


export default ComparisonFetchAndDisplay;
