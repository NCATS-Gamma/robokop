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
  }

  componentDidMount() {
    this.appConfig.questionData(this.props.id, data => this.setState({
      user: data.user,
      question: data.question,
      answersets: data.answerset_list,
      ready: true,
    }));
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
          answerUrlFunc={a => this.appConfig.urls.answerset(a.id)}
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
