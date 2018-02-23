import React from 'react';

import { Grid, Row, Col, FormControl, ListGroup, ListGroupItem } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';

const shortid = require('shortid');

class Answerset extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      timestamp: null,
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
      timestamp: data.timestamp,
      user: data.user,
      answerset: data.answerset,
      answers: data.answers,
      answerCount: data.answer_num,
      answersetGraph: data.answerset_graph,
      answersetFeedback: data.answerset_feedback,
      ready: true,
    }));
  }

  answerListFragment(answerset, answers) {
    const list = answers.map((a) => {
      return (
        <ListGroupItem key={shortid.generate()}>
          <a href={this.appConfig.urls.answer(answerset.id, a.id)}>
            An answer
          </a>
        </ListGroupItem>
      );
    });
    return (
      <div>
        <h3> Answers </h3>
        <ListGroup>
          {list}
        </ListGroup>
      </div>
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
        <h1>{'Answer Set:'}</h1>
        {this.answerListFragment(this.state.answerset, this.state.answers)}
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
