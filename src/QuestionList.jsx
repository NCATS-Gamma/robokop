import React from 'react';
import { Grid } from 'react-bootstrap';
import { Query } from 'react-apollo';
import { gql } from 'apollo-boost';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import QuestionListPres from './components/questionList/QuestionListPres';

const QUERY_GET_QUESTIONS = gql`
  {
    questions: allQuestionsList {
      id
      naturalQuestion
      ownerId
      notes
      timestamp
    }
  }
`;

class QuestionList extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      user: {},
    };

    this.callbackQuestionNew = this.callbackQuestionNew.bind(this);
    this.renderError = this.renderError.bind(this);
  }

  componentDidMount() {
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
  }
  callbackQuestionNew() {
    this.appConfig.redirect(this.appConfig.urls.questionDesign);
  }
  renderLoadingUser() {
    return (
      <p />
    );
  }
  renderError() {
    return (
      <h2>
        There was a problem contacting the server.
      </h2>
    );
  }
  renderLoadedUser() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Query query={QUERY_GET_QUESTIONS}>
          {({ loading, error, data }) => {
            if (loading) {
              // console.log('GraphQL is loading');
              return <Loading />;
            }

            if (error) {
              console.log('GraphQL error:', error);
              return this.renderError();
            }
            // Good response
            // console.log('GraphQL data:', data);
            return (
              <Grid>
                <QuestionListPres
                  loginUrl={this.appConfig.urls.login}
                  callbackQuestionNew={this.callbackQuestionNew}
                  callbackAnswersetSelect={(q, a) => this.appConfig.open(this.appConfig.urls.answerset(q.id, a.id))}
                  callbackQuestionSelect={q => this.appConfig.open(this.appConfig.urls.question(q.id))}
                  questions={data.questions}
                  user={this.state.user}
                />
              </Grid>
            );
          }}
        </Query>
        <Footer config={this.props.config} />
      </div>
    );
  }
  render() {
    const ready = this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoadingUser()}
        {ready && this.renderLoadedUser()}
      </div>
    );
  }
}

export default QuestionList;
