import React from 'react';

import { Grid, Jumbotron, ButtonToolbar, Button } from 'react-bootstrap';

import AppConfig from '../AppConfig';
import Loading from '../components/Loading';
import Header from '../components/Header';
import Footer from '../components/Footer';

class Landing extends React.Component {
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
        console.log('Failed to retrieve user information. This may indicate a connection issue.');
        console.log(err);
      },
    );
  }

  render() {
    const { user, ready } = this.state;
    const validUser = this.appConfig.ensureUser(user);
    const showLogIn = !validUser.is_authenticated;
    const shownNewQuestion = !showLogIn && this.appConfig.enableNewQuestions;
    return (
      <div>
        {ready ?
          <div>
            <Header config={this.props.config} user={this.state.user} />
            <Grid>
              <Jumbotron
                style={{
                  backgroundColor: this.appConfig.colors.bluegray,
                }}
              >
                <h1>Robokop</h1>
                <p>
                  <b>R</b>easoning <b>O</b>ver <b>B</b>iomedical <b> O</b>bjects linked in <b>K</b>nowledge <b>O</b>riented <b>P</b>athways
                </p>
                <p>
                  {'Robokop is a biomedical reasoning system that interacts with many biomedical knowledge sources to answer questions. Robokop is one of several prototype systems under active development with '}
                  <a href="https://ncats.nih.gov/">NIH NCATS</a>.
                </p>
                <p>
                  <a style={{ fontSize: 'small' }} href={this.appConfig.urls.about}>Learn More</a>
                </p>
                <ButtonToolbar style={{ paddingTop: '10px' }}>
                  <Button bsSize="large" href={this.appConfig.urls.questions}>
                    Browse Questions
                  </Button>
                  {shownNewQuestion &&
                    <Button bsSize="large" href={this.appConfig.urls.questionDesign}>
                      Ask a Question
                    </Button>
                  }
                  {showLogIn &&
                    <Button bsSize="large" href={this.appConfig.urls.login}>
                      Log In
                    </Button>
                }
                </ButtonToolbar>
              </Jumbotron>
            </Grid>
            <Footer config={this.props.config} />
          </div>
        :
          <Loading />
        }
      </div>
    );
  }
}

export default Landing;
