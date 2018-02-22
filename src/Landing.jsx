import React from 'react';

import { Jumbotron, ButtonToolbar, Button } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';


class Landing extends React.Component {
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
    this.appConfig.landingData(data => this.setState({
      timestamp: data.timestamp,
      user: data.user,
      ready: true,
    }));
  }

  renderLoading() {
    return (
      <Loading />
    );
  }

  renderLoaded() {
    const user = this.appConfig.ensureUser(this.state.user);
    const showLogIn = !user.is_authenticated;

    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Jumbotron>
          <h1>Robokop</h1>
          <p>
            <b>R</b>easoning <b>O</b>ver <b>B</b>iomedical <b> O</b>bjects linked in <b>K</b>nowledge <b>O</b>riented <b>P</b>athways
          </p>
          <p>
            Robokop is a biomedical reasoning system that interects with many biomedical knowledge sources to help
            find answers to questions. Robokop is one of several prototype systems under active development with
            <a href="https://ncats.nih.gov/">NIH NCATS</a>.
          </p>
          <ButtonToolbar>
            <Button bsSize="large" href={this.appConfig.urls.questionList}>
              Browse Questions
            </Button>
            {!showLogIn &&
              <Button bsSize="large" href={this.appConfig.urls.questionNew}>
                Ask a Question
              </Button>
            }
          </ButtonToolbar>
          <p />
          {showLogIn &&
            <p>
              {'To start asking your own questions '}<a href={this.appConfig.urls.login}>Log In</a>.
            </p>
          }
        </Jumbotron>
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

export default Landing;
