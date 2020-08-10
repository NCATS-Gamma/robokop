import React, { useState, useEffect } from 'react';
import {
  Grid, Jumbotron, ButtonToolbar, Button, ListGroup,
  ListGroupItem, Glyphicon, Col, Row,
} from 'react-bootstrap';

import config from '../config.json';
import Loading from '../components/shared/Loading';
import PromotedCarousel from '../components/promotedCarousel/PromotedCarousel';

import ensureUser from '../utils/ensureUser';

import './simplecss.css';

function CustomComponent({
  glyph, header, text, href,
}) {
  return (
    <Col md={6}>
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

export default function Landing() {
  const [ready, setReady] = useState(true);
  const [user, setUser] = useState({});

  useEffect(() => {
    /* eslint-disable no-console */
    // this.appConfig.user(
    //   data =>
    //     this.setState({
    //       user: data,
    //       ready: true,
    //     }),
    //   (err) => {
    //     console.log('Failed to retrieve user information. This may indicate a connection issue.');
    //     console.log(err);
    //   },
    // );
    /* eslint-enable no-console */
  }, []);

  const validUser = ensureUser(user);
  const showLogIn = !validUser.is_authenticated;
  const shownNewQuestion = !showLogIn && config.settings.enableNewQuestions;
  return (
    <div>
      {ready ? (
        <div>
          <Grid>
            <Jumbotron>
              <h1>Robokop</h1>
              <p>
                <b>R</b>easoning <b>O</b>ver <b>B</b>iomedical <b> O</b>bjects
                linked in <b>K</b>nowledge <b>O</b>riented <b>P</b>athways
              </p>
              <p>
                Robokop is a biomedical reasoning system that interacts with many biomedical knowledge
                sources to answer questions. Robokop is one of several prototype systems under active development with
                <a href="https://ncats.nih.gov/">NIH NCATS</a>.
              </p>
              <p>
                <a
                  style={{ fontSize: 'small' }}
                  href={config.routes.guide}
                >
                  Learn More
                </a>
              </p>
              <ButtonToolbar style={{ paddingTop: '10px' }}>
                <Button bsSize="large" href={config.routes.questions}>
                  Browse Questions
                </Button>
                {shownNewQuestion ? (
                  <Button
                    bsSize="large"
                    href={config.routes.questionDesign}
                  >
                    Ask a Question
                  </Button>
                ) : (
                  <Button
                    bsSize="large"
                    href={config.routes.simpleQuestion}
                  >
                    Ask a Quick Question
                  </Button>
                )}
              </ButtonToolbar>
            </Jumbotron>
            {/* <PromotedCarousel
              appConfig={this.appConfig}
            /> */}
            <Jumbotron>
              <h2>Robokop Apps</h2>
              <ListGroup>
                <Row>
                  <CustomComponent
                    glyph="question-sign"
                    header="Quick Question"
                    text="Ask a question and get an answerset back. This question will not be stored and you don&apos;t have to be signed in."
                    href={config.routes.simpleQuestion}
                  />
                  <CustomComponent
                    glyph="link"
                    header="Identifier Lookup"
                    text="Provide an identifier and receive all of the other identifiers by which that entity is known, as well as the identifier by which that entity is known in Robokop."
                    href={config.routes.synonymize}
                  />
                </Row>
                <Row>
                  <CustomComponent
                    glyph="import"
                    header="Answerset Explorer"
                    text="Easily upload JSON files of answersets to view them in Robokop&apos;s graphical interface."
                    href={config.routes.view}
                  />
                  <CustomComponent
                    glyph="fullscreen"
                    header="Expand"
                    text="Build simple one-hop questions and receive ranked results. You can specify returned types, predicates, and edge directionality."
                    href={config.routes.expand}
                  />
                </Row>
                <Row>
                  <CustomComponent
                    glyph="random"
                    header="Enrich"
                    text="Provide a list of entities of one type, and receive a list of entities that connect to the input more frequently than would be expected by chance."
                    href={config.routes.enrich}
                  />
                  <CustomComponent
                    glyph="duplicate"
                    header="Similarity"
                    text="Perform a Jaccard similarity search in the Robokop knowledge graph, where similarity is calculated over shared nodes. Receive the most similar nodes, along with their similarity scores."
                    href={config.routes.similarity}
                  />
                </Row>
                <Row>
                  <CustomComponent
                    glyph="list-alt"
                    header="Omnicorp"
                    text="Provide a list of defined identifiers and receive the publications that they share."
                    href={config.routes.publications}
                  />
                  <CustomComponent
                    glyph="screenshot"
                    header="Neighborhood"
                    text="Explore many sources and one-hop neighbors from specified node."
                    href={config.routes.neighborhood}
                  />
                </Row>
              </ListGroup>
            </Jumbotron>
          </Grid>
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
}
