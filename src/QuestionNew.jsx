import React from 'react';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';

import QuestionNewPres from './components/questionNew/QuestionNewPres';

class QuestionNew extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      user: {},
    };

    this.onCreate = this.onCreate.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this.appConfig.questionNewData(data => this.setState({
      user: data.user,
      ready: true,
    }));
  }

  onCreate() {
    console.log('Create the thing here');
  }
  onCancel() {
    window.history.back();
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
        <QuestionNewPres
          callbackCreate={this.onCreate}
          callbackCancel={this.onCancel}
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

export default QuestionNew;
