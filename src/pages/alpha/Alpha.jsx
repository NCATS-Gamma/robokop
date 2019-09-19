import React from 'react';
import AppConfig from '../../AppConfig';
import { config } from '../../index';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

import AlphaMainContents from './mainContents';

class Alpha extends React.Component {
  constructor(props) {
    super(props);

    this.appConfig = new AppConfig(config);

    this.state = {
      user: {},
      concepts: [],
    };
  }

  componentDidMount() {
    this.initializeState();
  }

  initializeState() {
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
    }));
    this.appConfig.concepts(data => this.setState({
      concepts: data,
    }));
  }

  render() {
    const { user, concepts } = this.state;
    return (
      <div>
        <Header config={config} user={user} />
        <AlphaMainContents
          concepts={concepts}
          appConfig={this.appConfig}
        />
        <Footer config={config} />
      </div>
    );
  }
}

export default Alpha;
