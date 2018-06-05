import React from 'react';

import { Grid, Row, Col, Jumbotron, Panel, ButtonToolbar, Button } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';

class Start extends React.Component {
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
    this.appConfig.user(
      data => this.setState({
        user: data,
        ready: true,
      }),
      (err) => {
        console.log('Failed to retrieve user information. This may indicate a connection issue.')
        console.log(err);
      },
    );
  }

  renderLoading() {
    return (
      <Loading />
    );
  }

  renderLoaded() {
    const user = this.appConfig.ensureUser(this.state.user);
    const showLogIn = !user.is_authenticated;
    const shownNewQuestion = !showLogIn && this.appConfig.enableNewQuestions;

    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          <Row>
            <Col>
              <h1>
                Robokop Quick Start Guide
              </h1>
              <p>
                {'Robokop is a system for getting answers to biomedical questions like: "What drugs are used to treat depression?" or "What genes are target by Ibuprophen" or maybe one day "What FDA approved drugs might be beneficial for the treatment of ALS?'}
              </p>
              <h2>
                Create an Account
              </h2>
              <h2>
                Ask a Question
              </h2>
              <h2>
                Exploring Answers
              </h2>
              <h2>
                Providing Feedback
              </h2>
              <h2>
                Asking Another Question
              </h2>
            </Col>
          </Row>
        </Grid>
        <Footer config={this.props.config} />
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

export default Start;
