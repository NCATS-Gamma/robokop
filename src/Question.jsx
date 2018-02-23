import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col, FormControl, ListGroup, ListGroupItem } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';

import customPropTypes from './customPropTypes';

const shortid = require('shortid');

class Question extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      timestamp: null,
      user: {},
      question: {},
      answersets: [],
    };
  }

  componentDidMount() {
    this.appConfig.questionData(this.props.id, data => this.setState({
      timestamp: data.timestamp,
      user: data.user,
      question: data.question,
      answersets: data.answerset_list,
      ready: true,
    }));
  }

  timestampReadable(ts) {
    return ts;
  }
  answersetFragment(answersets) {
    const list = answersets.map((a) => {
      return (
        <ListGroupItem key={shortid.generate()}>
          <a href={this.appConfig.urls.answerset(a.id)}>
            {a.timestamp}
          </a>
        </ListGroupItem>
      );
    });
    return (
      <div>
        <h3> Answer Sets </h3>
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
    const natural = this.state.question.natural_question;
    const {
      name,
      user,
      notes,
      hash,
    } = this.state.question;

    const construction = {
      edges: this.state.question.edges,
      nodes: this.state.question.nodes,
    };

    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          <Row>
            <Col md={6}>
              <h2>{name}</h2>
              <h4>{natural}</h4>
              <h5>{user}</h5>
              <p>{hash}</p>
              <FormControl
                componentClass="textarea"
                placeholder="Notes"
                inputRef={(ref) => { this.notesRef = ref; }}
                data={notes}
              />
              {this.answersetFragment(this.state.answersets)}
            </Col>
            <Col md={6}>
              <div style={{ background: 'tomato' }}>
                <h2>Construction Plan:</h2>
                <h4>{`${construction.nodes.length} Concepts`}</h4>
                <h4>{`${construction.edges.length} Edges`}</h4>
              </div>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <div style={{ background: 'tomato' }}>
                <h2>Snap shot of sub-knowledge graph</h2>
              </div>
            </Col>
          </Row>
        </Grid>
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

Question.propTypes = {
  config: customPropTypes.config.isRequired,
  id: PropTypes.string.isRequired,
};

export default Question;
