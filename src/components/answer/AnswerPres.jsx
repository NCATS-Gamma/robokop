import React from 'react';

import { Grid, Row, Col } from 'react-bootstrap';

class AnswerPres extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {

    return (
      <Grid>
        <Row>
          <Col md={12}>
            Answer
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default AnswerPres;
