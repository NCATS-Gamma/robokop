import React from 'react';

import appConfig from './appConfig';
import Loading from './components/Loading';
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
      <Loading/>
    );
  }
  renderQuestions(){
    return this.state.questions.map((q) => {
      return [
        <li>
          <a href={this.appConfig.urls.question(q.id)}>Go!</a> {`${JSON.stringify(q)}`}
        </li>
        ,
      ];
    });
  }
  renderLoaded(){
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <h1>{'Question List'}</h1>
        <ul>{this.renderQuestions()}</ul>
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
