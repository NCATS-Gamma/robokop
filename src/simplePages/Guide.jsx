import React from 'react';

import { Grid, Row, Col, ButtonToolbar, Button } from 'react-bootstrap';

import AppConfig from '../AppConfig';
import Loading from '../components/Loading';
import Header from '../components/Header';
import Footer from '../components/Footer';

class Guide extends React.Component {
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
              <Row>
                <Col md={8}>
                  <h2>
                    Robokop Quick Start Guide
                  </h2>
                  <p>
                    {'Robokop is a system for getting answers to biomedical questions like: "What drugs are used to treat depression?" or "What genes are target by Ibuprophen" or maybe one day "What FDA approved drugs might be beneficial for the treatment of ALS?'}
                  </p>
                  <hr />
                  <h3>
                    Create an Account
                  </h3>
                  <p>
                    {'You can browse questions asked by other users without an account, but if you want to ask questions of your own, you will need register an account with your email.'}
                  </p>
                  <hr />
                  <h3>
                    Ask a Question
                  </h3>
                  <p>
                    {'Currently, questions in Robokop are "asked" by specifying a path template through types of nodes in a knowledge graph. The '}<a href={this.appConfig.urls.questionDesign}>New Question Page</a> {' will provide further details.'}
                  </p>
                  <hr />
                  <h3>
                    Getting Answers
                  </h3>
                  <p>
                    {'Under the hood, Robokop has an ever evolving knowledge graph. Answers collected today might not be the same as answers collected tomorrow, as more knowledge sources and information is found by Robokop.'}
                  </p>
                  <p>
                    {'When a question is first asked, we first try to find answers, creating what is known as an '}<b>Answer Set</b>{'. An answer set contains a ranked list of potential answers to your question found within our knowledge graph and prioritized using our reasoning engine.'}
                  </p>
                  <h4 style={{ paddingTop: '8px' }}>
                    An Answer is a Graph
                  </h4>
                  <p>
                    {'Each answer provided by Robokop is a small knowledge graph that meets the criteria specified in your question. This graph will contain links between biomedial concepts with connections that have been identified by vairous knowledge sources.'}
                  </p>
                  <h4 style={{ paddingTop: '8px' }}>
                    Updating the Knowledge Graph
                  </h4>
                  <p>
                    {'If initial answers to your question were not able to be found, it may be because the knowledge graph is incompletely. If this happens, we will analyze your quesiton and attempt to contact relevant knowledge sources to add to our knowledge graph to better answer your question. This process can be rather lengthy (sometimes an hour or more), if this happens we will email you when everything is complete.'}
                  </p>
                  <hr />
                  <h3>
                    Exploring Answers
                  </h3>
                  <p>
                    {'Exploration tools are available to select an answer from within the answer set. The provenance of each connection in the answer can be explored along with supporting publications.'}
                  </p>
                  {/* <h4 style={{ paddingTop: '8px' }}>
                    Providing Feedback
                  </h4>
                  <p>
                    {'You can provide feedback about which answer in an answerset you think is best. Over time we will use the feedback to improve the ranking engine inside of Robokop.'}
                  </p> */}
                  <hr />
                  <h3>
                    Go Get Started
                  </h3>
                  <ButtonToolbar>
                    <Button bsSize="large" bsStyle="link" href={this.appConfig.urls.questions}>
                      Browse Questions
                    </Button>
                    {shownNewQuestion &&
                      <Button bsSize="large" bsStyle="link" href={this.appConfig.urls.questionDesign}>
                        Ask a Question
                      </Button>
                    }
                    {showLogIn &&
                      <Button bsSize="large" bsStyle="link" href={this.appConfig.urls.login}>
                        Log In / Register
                      </Button>
                    }
                  </ButtonToolbar>
                  <br />
                </Col>
              </Row>
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

export default Guide;
