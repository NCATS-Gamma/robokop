import React from 'react';

import { Grid, Row, Col, FormControl, ListGroup, ListGroupItem } from 'react-bootstrap';

const shortid = require('shortid');

class QuestionPres extends React.Component {
  timestampReadable(ts) {
    return ts;
  }
  answersetFragment(answersets) {
    const list = answersets.map((a) => {
      return (
        <ListGroupItem key={shortid.generate()}>
          <a href={this.props.answerUrlFunc(a)}>
            {a.timestamp}
          </a>
        </ListGroupItem>
      );
    });
    return (
      <div>
        <h3> Answer Sets </h3>
        <ListGroup>
          {list}
        </ListGroup>
      </div>
    );
  }

  render() {
    const natural = this.props.question.natural_question;
    const {
      name,
      user,
      notes,
      hash,
    } = this.props.question;

    const construction = {
      edges: this.props.question.edges,
      nodes: this.props.question.nodes,
    };

    return (
      <Grid>
        <Row>
          <Col md={6}>
            <h2>{name}</h2>
            <h4>{natural}</h4>
            <h5>{user}</h5>
            <p>{hash}</p>
            <FormControl
              componentClass="textarea"
              placeholder="Notes"
              inputRef={(ref) => { this.notesRef = ref; }}
              data={notes}
            />
            {this.answersetFragment(this.props.answersets)}
          </Col>
          <Col md={6}>
            <div style={{ background: 'tomato' }}>
              <h2>Construction Plan:</h2>
              <h4>{`${construction.nodes.length} Concepts`}</h4>
              <h4>{`${construction.edges.length} Edges`}</h4>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <div style={{ background: 'tomato' }}>
              <h2>Snap shot of sub-knowledge graph</h2>
            </div>
          </Col>
        </Row>
      </Grid>
    );
  }
}

// answerHrefFunc - function
// question.natural_question;
//     const {
//       name,
//       user,
//       notes,
//       hash,
// edges: this.props.question.edges,
// nodes: this.props.question.nodes,
// answersets

export default QuestionPres;
