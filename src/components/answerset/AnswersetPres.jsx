import React from 'react';

import { Grid, Row, Col, ListGroup, ListGroupItem } from 'react-bootstrap';

const shortid = require('shortid');

class AnswersetPres extends React.Component {
  constructor(props) {
    super(props);
    
  }

  answerListFragment(answerset, answers) {
    const list = answers.map((a) => {
      return (
        <ListGroupItem key={shortid.generate()}>
          <a href={this.props.answerUrlFunc(answerset, a)}>
            An answer
          </a>
        </ListGroupItem>
      );
    });
    return (
      <div>
        <h3> Answers </h3>
        <ListGroup>
          {list}
        </ListGroup>
      </div>
    );
  }

  render() {
    return (
      <div>
        <Grid>
          <Row>
            <Col md={12}>
              <h1>{'Answer Set:'}</h1>
              {this.answerListFragment(this.props.answerset, this.props.answers)}
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default AnswersetPres;
