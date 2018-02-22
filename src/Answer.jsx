import React from 'react';

import AppConfig from './AppConfig';
import Header from './components/Header';

class Answer extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      timestamp: null,
      user: {},
    };
  }

  componentDidMount() {
    this.appConfig.answerData( this.props.setId, this.props.id, (data) => this.setState({timestamp: data.timestamp, user: data.user, ready: true}));
  }

  renderLoading() {
    return (
      <div>
        <h1>{'Loading...'}</h1>
      </div>
    );
  }
  renderLoaded(){
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <h1>{'Answer'}</h1>
        <h3>{`Time: ${this.state.timestamp}`}</h3>
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
