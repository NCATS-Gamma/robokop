import React from 'react';

import { Grid, Row, Col, ButtonToolbar, Button } from 'react-bootstrap';

const shortid = require('shortid');

class WorkflowStepExport extends React.Component {
  constructor(props) {
    super(props);

    this.export = this.export.bind(this);
  }

  export() {
    this.props.callbackDone();
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col>
            Export content
            <ButtonToolbar>
              <Button bsSize="large" onClick={this.export}>
                Export
              </Button>
            </ButtonToolbar>
          </Col>
        </Row>
      </Grid>
    );
  }
}

WorkflowStepExport.defaultProps = {
  answer: {},
  callbackDone: () => {},
};

export default WorkflowStepExport;
