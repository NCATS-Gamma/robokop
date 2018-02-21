import React from 'react';

import appConfig from './appConfig';
import Header from './components/Header';

class QuestionList extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new appConfig(props.config);

    this.state = {
      ready: false,
      timestamp: null,
      user: {},
    };
  }

  componentDidMount() {
    this.appConfig.questionListData( (data) => this.setState({timestamp: data.timestamp, 
                                                              user: data.user, 
                                                              questions: data.questions,
                                                              ready: true}));
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
        <h1>{'Question List'}</h1>
        <h3>{`Questions: ${JSON.stringify(this.state.questions)}`}</h3>
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

export default QuestionList;
