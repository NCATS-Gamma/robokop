import React from 'react';
import { Link } from 'react-router-dom';

import {
  Grid, Row, Col, ButtonToolbar, Button,
} from 'react-bootstrap';

/**
 * Robokop Guide Page
 * @param {boolean} isSignedIn is the user signed in
 */
export default function Guide({ isSignedIn }) {
  return (
    <Grid>
      <Row>
        <Col md={8}>
          <h2>
            Robokop Quick Start Guide
          </h2>
          <p>
            Robokop is a system for getting answers to biomedical questions like:
            {' "What drugs are used to treat depression?" or "What genes are target by Ibuprophen" or maybe one day "What FDA approved drugs might be beneficial for the treatment of ALS?"'}
          </p>
          <hr />
          <h3>
            Sign In
          </h3>
          <p>
            You can browse saved questions and ask new questions without being signed in, but your new
            questions won&apos;t be saved. In order to save questions, you will need to sign in.
          </p>
          <hr />
          <h3>
            Ask a Question
          </h3>
          <p>
            Currently, questions in Robokop are &quot;asked&quot; by specifying a path template through types of nodes
            in a knowledge graph. The <Link to="/help">Help Page</Link> will provide further
            details on asking new questions.
          </p>
          <hr />
          <h3>
            Getting Answers
          </h3>
          <p>
            Under the hood, Robokop has an ever evolving knowledge graph. Answers collected today might not
            be the same as answers collected tomorrow, as more knowledge sources and information is found by Robokop.
          </p>
          <p>
            When a question is first asked, we first try to find answers, creating what is known as
            an <b>Answer Set</b>. An answer set contains a ranked list of potential answers to your
            question found within our knowledge graph and prioritized using our reasoning engine.
          </p>
          <h4 style={{ paddingTop: '8px' }}>
            An Answer is a Graph
          </h4>
          <p>
            Each answer provided by Robokop is a small knowledge graph that meets the criteria
            specified in your question. This graph will contain links between biomedial concepts
            with connections that have been identified by vairous knowledge sources.
          </p>
          <h4 style={{ paddingTop: '8px' }}>
            Updating the Knowledge Graph
          </h4>
          <p>
            If initial answers to your question were not able to be found, it may be because the
            knowledge graph is incomplete. If this happens, we will analyze your quesiton and attempt to
            contact relevant knowledge sources to add to our knowledge graph to better answer your question.
            This process can be rather lengthy (sometimes an hour or more). If this happens and you
            have an account, we will email you when everything is complete.
          </p>
          <hr />
          <h3>
            Exploring Answers
          </h3>
          <p>
            Exploration tools are available to select an answer from within the answer set.
            The provenance of each connection in the answer can be explored along with supporting publications.
          </p>
          {/* <h4 style={{ paddingTop: '8px' }}>
            Providing Feedback
          </h4>
          <p>
            {'You can provide feedback about which answer in an answerset you think is best. Over time we will use the feedback to improve the ranking engine inside of Robokop.'}
          </p> */}
          <hr />
          <h3>Walkthrough</h3>
          <p>
            A comprehensive walkthrough of the application can be found
            at <a target="_blank" rel="noopener noreferrer" href="https://researchsoftwareinstitute.github.io/data-translator/apps/robokop">RSI Data Translator Robokop App</a>.
          </p>
          <hr />
          <h3>
            Get Started
          </h3>
          <ButtonToolbar style={{ marginBottom: '20px' }}>
            <Link to="/questions">
              <Button bsSize="large">
                Browse Questions
              </Button>
            </Link>
            {isSignedIn ? (
              <Link to="/q/new">
                <Button bsSize="large">
                  Ask a Question
                </Button>
              </Link>
            ) : (
              <Link to="/simple/question">
                <Button bsSize="large">
                  Ask a Quick Question
                </Button>
              </Link>
            )}
          </ButtonToolbar>
          <br />
        </Col>
      </Row>
    </Grid>
  );
}
