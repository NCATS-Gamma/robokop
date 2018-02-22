import React from 'react';

import AppConfig from './AppConfig';
import Header from './components/Header';

class Account extends React.Component {
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
    this.appConfig.accountData( (data) => this.setState({timestamp: data.timestamp, user: data.user, ready: true}));
  }

  renderLoading() {
    return (
      <div>
        <h1>{'Loading account data ...'}</h1>
      </div>
    );
  }
  renderLoaded(){
    const user = this.appConfig.ensureUser(this.state.user);

    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <h1>{'Account Settings'}</h1>
        <h3>{`User: ${user.username}`}</h3>
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

export default Account;
