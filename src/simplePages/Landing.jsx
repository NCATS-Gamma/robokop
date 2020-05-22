import React from 'react';
import {
  Grid, Jumbotron, ButtonToolbar, Button, ListGroup,
  ListGroupItem, Glyphicon, Col, Row,
} from 'react-bootstrap';
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

  CustomComponent({
    glyph, header, text, href,
  }) {
    return (
      <Col md={6} >
        <ListGroupItem
          style={{ padding: '15px', margin: '15px 0px' }}
          href={href}
        >
          <div style={{ height: '155px', display: 'flex' }}>
            <div
              style={{
                padding: '20px', display: 'flex', alignItems: 'center',
              }}
            >
              <Glyphicon glyph={glyph} style={{ fontSize: '40px' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '20px' }}>{header}</h4>
              <p style={{ fontSize: '16px' }}>{text}</p>
            </div>
          </div>
        </ListGroupItem>
      </Col>
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
                <h1>COVID-KOP</h1>
                <p>
                  <b>COVID</b> linked in <b>K</b>nowledge <b>O</b>riented <b>P</b>athways
                </p>
                <p>
                  {
                    'COVID-KOP is a biomedical reasoning system combining the knowledge existing in the ROBOKOP ' +
                    'knowledge graph and data collected about the COVID-19 pandemic.'
                  }
                </p>
                <p>
                  {
                    'Data presented through COVID-KOP includes:'
                  }
                  <ul>
                    <li>{ 'Drugs in clinical trials against COVID-19 (from ' }
                      <a href="https://www.drugbank.ca/covid-19" target='_blank'>DrugBank</a>
                      {')'}</li>
                    <li>
                      Literature Co-occurrences from <a href="https://www.semanticscholar.org/cord19">CORD-19</a>
                    </li>
                    <li>Viral Proteome annotations from <a href="https://www.ebi.ac.uk/GOA/">GOA</a></li>
                    <li>COVID-19 phenotypes</li>
                  </ul>
                </p>
                <p>
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
                  {shownNewQuestion ?
                    <Button
                      bsSize="large"
                      href={this.appConfig.urls.questionDesign}
                    >
                      Ask a Question
                    </Button>
                    :
                    <Button
                      bsSize="large"
                      href={this.appConfig.urls.simpleQuestion}
                    >
                      Ask a Quick Question
                    </Button>
                  }
                </ButtonToolbar>
              </Jumbotron>
              <Jumbotron>
                <h2>Robokop Apps</h2>
                <ListGroup>
                  <Row>
                    <this.CustomComponent
                      glyph="question-sign"
                      header="Quick Question"
                      text="Ask a question and get an answerset back. This question will not be stored and you don&apos;t have to be signed in."
                      href={this.appConfig.urls.simpleQuestion}
                    />
                    <this.CustomComponent
                      glyph="link"
                      header="Identifier Lookup"
                      text="Provide an identifier and receive all of the other identifiers by which that entity is known, as well as the identifier by which that entity is known in Robokop."
                      href={this.appConfig.urls.synonymize}
                    />
                  </Row>
                  <Row>
                    <this.CustomComponent
                      glyph="import"
                      header="Answerset Explorer"
                      text="Easily upload JSON files of answersets to view them in Robokop&apos;s graphical interface."
                      href={this.appConfig.urls.view}
                    />
                    <this.CustomComponent
                      glyph="fullscreen"
                      header="Expand"
                      text="Build simple one-hop questions and receive ranked results. You can specify returned types, predicates, and edge directionality."
                      href={this.appConfig.urls.expand}
                    />
                  </Row>
                  <Row>
                    <this.CustomComponent
                      glyph="random"
                      header="Enrich"
                      text="Provide a list of entities of one type, and receive a list of entities that connect to the input more frequently than would be expected by chance."
                      href={this.appConfig.urls.enrich}
                    />
                    <this.CustomComponent
                      glyph="duplicate"
                      header="Similarity"
                      text="Perform a Jaccard similarity search in the Robokop knowledge graph, where similarity is calculated over shared nodes. Receive the most similar nodes, along with their similarity scores."
                      href={this.appConfig.urls.similarity}
                    />
                  </Row>
                  <Row>
                    <this.CustomComponent
                      glyph="list-alt"
                      header="Omnicorp"
                      text="Provide a list of defined identifiers and receive the publications that they share."
                      href={this.appConfig.urls.publications}
                    />
                    <this.CustomComponent
                      glyph="screenshot"
                      header="Neighborhood"
                      text="Explore many sources and one-hop neighbors from specified node."
                      href={this.appConfig.urls.alpha}
                    />
                  </Row>
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
