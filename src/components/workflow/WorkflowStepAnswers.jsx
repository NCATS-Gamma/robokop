import React from 'react';

import { Grid, Row, Col, ButtonToolbar, Button } from 'react-bootstrap';

const shortid = require('shortid');

class WorkflowStepAnswers extends React.Component {
  constructor(props) {
    super(props);

    this.selectAnswer = this.selectAnswer.bind(this);
  }

  selectAnswer() {
    // Do stuff that is important... then, possibly
    this.props.callbackEnableNextTab();
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col>
            Answer Set content
            <ButtonToolbar>
              <Button bsSize="large" onClick={this.selectAnswer}>
                Select Answer
              </Button>
              <Button bsSize="large" onClick={this.props.callbackToNextTab}>
                Go to Export
              </Button>
            </ButtonToolbar>
          </Col>
        </Row>
      </Grid>
    );
  }
}

WorkflowStepAnswers.defaultProps = {
  answerset: {},
  callbackEnableNextTab: () => {},
  callbackToNextTab: () => {},
};

export default WorkflowStepAnswers;
