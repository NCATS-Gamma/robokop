import React from 'react';

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
      ready: false,
      user: {},
    };
  }

  componentDidMount() {
    this.appConfig.answerData(
      this.props.setId,
      this.props.id,
      data => this.setState({
        user: data.user,
        ready: true,
      }),
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
        <AnswerPres
          question
          answerset
          answersetId={this.props}
          answerId={this.props.id}
          feedback={this.state.feedback}
          
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

export default Answer;
