import React from 'react';
import PropTypes from 'prop-types';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';

import customPropTypes from './customPropTypes';

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
    };
  }

  componentDidMount() {
    this.appConfig.questionData(this.props.id, data => this.setState({
      timestamp: data.timestamp,
      user: data.user,
      question: data.question,
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
        <h1>Question:</h1>
        <p>
          {JSON.stringify(this.state.question)}
        </p>
        <h5>{`Time: ${this.state.timestamp}`}</h5>
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
