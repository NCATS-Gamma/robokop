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

  onCreate(postData) {
    this.appConfig.questionNewSubmit(postData);
  }
  onSearch(postData) {
    this.appConfig.questionNewSearch(postData);
  }
  onValidate(postData) {
    this.appConfig.questionNewValidate(postData);
  }
  onTranslate(postData) {
    this.appConfig.questionNewTranslate(postData);
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
          callbackSearch={this.onSearch}
          callbackValidate={this.onValidate}
          callbackTranslate={this.onTranslate}
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
