import React from 'react';
import { Grid, Jumbotron, ButtonToolbar, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import './simplecss.css';
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
      data =>
        this.setState({
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
        {ready ? (
          <div>
            <Header config={this.props.config} user={this.state.user} />
            <Grid>
              <Jumbotron>
                <h1>Robokop</h1>
                <p>
                  <b>R</b>easoning <b>O</b>ver <b>B</b>iomedical <b> O</b>bjects
                  linked in <b>K</b>nowledge <b>O</b>riented <b>P</b>athways
                </p>
                <p>
                  {
                    'Robokop is a biomedical reasoning system that interacts with many biomedical knowledge sources to answer questions. Robokop is one of several prototype systems under active development with '
                  }
                  <a href="https://ncats.nih.gov/">NIH NCATS</a>.
                </p>
                <p>
                  <a
                    style={{ fontSize: 'small' }}
                    href={this.appConfig.urls.guide}
                  >
                    Learn More
                  </a>
                </p>
                <ButtonToolbar style={{ paddingTop: '10px' }}>
                  <Button bsSize="large" href={this.appConfig.urls.questions}>
                    Browse Questions
                  </Button>
                  {shownNewQuestion && (
                    <Button
                      bsSize="large"
                      href={this.appConfig.urls.questionDesign}
                    >
                      Ask a Question
                    </Button>
                  )}
                  {showLogIn && (
                    <Button bsSize="large" href={this.appConfig.urls.login}>
                      Log In
                    </Button>
                  )}
                </ButtonToolbar>
              </Jumbotron>
              <Jumbotron>
                <h2>Robokop Apps</h2>
                <ListGroup>
                  <ListGroupItem
                    href={this.appConfig.urls.search}
                    style={{ padding: '15px' }}
                    header="Bionames Lookup"
                  >
                    Find Identifiers for Biomedical Concepts. This service takes human readable names and returns possible identifiers from a set of vocabularies.
                  </ListGroupItem>
                  <ListGroupItem
                    href={this.appConfig.urls.view}
                    style={{ padding: '15px' }}
                    header="Answerset Explorer"
                  >
                    Easily upload JSON files of answersets to view them in Robokop&apos;s graphical interface.
                  </ListGroupItem>
                  <ListGroupItem
                    href={this.appConfig.urls.simpleQuestion}
                    style={{ padding: '15px' }}
                    header="Simple Question"
                  >
                    Ask a question and get an answerset back. This question will not be stored and you don&apos;t have to be signed in.
                  </ListGroupItem>
                  <ListGroupItem
                    href={this.appConfig.urls.expand}
                    style={{ padding: '15px' }}
                    header="Expand"
                  >
                    Use the Robokop Expand API. This API allows users to post simple one-hop questions and received ranked results. Users can control returned types, predicates, and edge directionality.
                  </ListGroupItem>
                  <ListGroupItem
                    href={this.appConfig.urls.enrich}
                    style={{ padding: '15px' }}
                    header="Enrich"
                  >
                    Use the Robokop Enrich API. This API takes a list of entities of one type, and returns a list of entities that connect to the input more frequently than would be expected by chance.
                  </ListGroupItem>
                  <ListGroupItem
                    href={this.appConfig.urls.similarity}
                    style={{ padding: '15px' }}
                    header="Similarity"
                  >
                    Use the Robokop Similarity API. This API performs a Jaccard similarity search in the Robokop knowledge graph, where similarity is calculated over shared nodes. Returns the most similar nodes, along with their similarity scores.
                  </ListGroupItem>
                  <ListGroupItem
                    href={this.appConfig.urls.synonymize}
                    style={{ padding: '15px' }}
                    header="Synonymize"
                  >
                    Use the Robokop Synonymize API. The same entity may have many different names in different naming systems. This API takes an identifier and returns all of the other identifiers by which that entity is known, as well as the identifier by which that entity is known in Robokop.
                  </ListGroupItem>
                  <ListGroupItem
                    href={this.appConfig.urls.publications}
                    style={{ padding: '15px' }}
                    header="Omnicorp"
                  >
                    Use the Robokop Omnicorp API. This API takes defined entities and returns the publications that they share.
                  </ListGroupItem>
                </ListGroup>
              </Jumbotron>
            </Grid>
            <Footer config={this.props.config} />
          </div>
        ) : (
          <Loading />
        )}
      </div>
    );
  }
}

export default Landing;
