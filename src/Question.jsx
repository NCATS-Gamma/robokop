import React from 'react';
import PropTypes from 'prop-types';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';

import QuestionPres from './components/question/QuestionPres';

import customPropTypes from './customPropTypes';

class Question extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      user: {},
      question: {},
      answersets: [],
    };

    this.callbackUpdateMeta = this.callbackUpdateMeta.bind(this);
    this.callbackRedo = this.callbackRedo.bind(this);
    this.callbackFork = this.callbackFork.bind(this);
    this.callbackDelete = this.callbackDelete.bind(this);
    this.callbackFetchGraph = this.callbackFetchGraph.bind(this);

  }

  componentDidMount() {
    this.appConfig.questionData(this.props.id, data => this.setState({
      user: data.user,
      question: data.question,
      answersets: data.answerset_list,
      ready: true,
    }));
  }

  callbackUpdateMeta(newMeta) {
    const q = this.state.question;
    const u = this.state.user;
    console.log('Send post request to update question data.');
  }
  callbackRedo() {
    const q = this.state.question;
    const u = this.state.user;
    console.log('Initiate getting another answerset for this question. Then show a message. Then hide the message. What about in progress stuff?');
  }
  callbackFork() {
    const q = this.state.question;
    const u = this.state.user;
    console.log('Fork question for user. Then show a message. Redirect to new question page');
  }
  callbackDelete() {
    const q = this.state.question;
    const u = this.state.user;
    console.log('Delete this question if possible. Then show a message. Redirect to questions.');
  }
  callbackFetchGraph() {
    const q = this.state.question;
    console.log('Fetch a subKG for this question, then return it');
    return { nodes: [], edges: [] }
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
        <QuestionPres
          callbackUpdateMeta={this.callbackUpdateMeta}
          callbackRedo={this.callbackRedo}
          callbackFork={this.callbackFork}
          callbackDelete={this.callbackDelete}
          callbackFetchGraph={this.callbackFetchGraph}
          answersetUrlFunc={a => this.appConfig.urls.answerset(a.id)}
          question={this.state.question}
          answersets={this.state.answersets}
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

Question.propTypes = {
  config: customPropTypes.config.isRequired,
  id: PropTypes.string.isRequired,
};

export default Question;
