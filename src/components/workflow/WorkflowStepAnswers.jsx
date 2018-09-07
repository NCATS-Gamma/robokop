import React from 'react';

import { Row, Col, ButtonToolbar, Button } from 'react-bootstrap';

const shortid = require('shortid');

class WorkflowStepAnswers extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inputQuestion: null,
      question: null,
      answerSet: null,
      answer: null,
      haveInput: false,
      haveQuestion: false,
      answerSetStatus: 'Awaiting Question',
      haveAnswerset: false,
      haveAnswer: false,
    }

    this.selectAnswer = this.selectAnswer.bind(this);
    this.begin = this.begin.bind(this);
    this.createQuestion = this.createQuestion.bind(this);
  }

  componentDidMount() {
    this.syncPropsAndState(this.props);
  }
  componentDidUpdate() {
    this.syncPropsAndState(this.props);
  }

  syncPropsAndState(newProps) {
    // The only prop we are concerned with is question
    // If question changes we need to be aware and create a new question and monitor progress
    if (newProps.question !== null && newProps.question !== this.state.inputQuestion) {
      this.begin();
    }
  }
  begin() {
    this.setState({ inputQuestion: this.props.question, haveInput: true }, this.createQuestion);
  }
  createQuestion() {
    // Requestion quesiton
    setTimeout(() => this.setState({ haveQuestion: true }, () => setTimeout(() => this.setState({ haveAnswerset: true }), 4000)), 2000);
  }

  selectAnswer() {
    // Do stuff that is important... then, possibly
    const answer = {};
    this.props.callbackEnableNextTab();
    this.props.callbackToNextTab(answer);
  }

  render() {
    const { haveInput, haveQuestion, haveAnswerset } = this.state;
    const containerStyle = {
      paddingLeft: '25px', //'15px',
      paddingRight: '15px',
      overflowY: 'scroll',
      overflowX: 'hidden',
    };

    return (
      <div style={containerStyle}>
        <Row>
          <Col>
            {!haveInput &&
              <h2>
                Awaiting Question
              </h2>
            }
            {haveInput && !haveQuestion &&
              <h2>
                Generating Question
              </h2>
            }
            {haveInput && haveQuestion && !haveAnswerset &&
              <h2>
                Getting Answers to your Question
              </h2>
            }
            {haveInput && haveQuestion && haveAnswerset &&
              <div>
                <h2>
                  Please Select an Answer
                </h2>
                <ButtonToolbar>
                  <Button bsSize="large" onClick={this.selectAnswer}>
                    Select Answer
                  </Button>
                </ButtonToolbar>
              </div>
            }
          </Col>
        </Row>
      </div>
    );
  }
}

WorkflowStepAnswers.defaultProps = {
  question: null,
  callbackEnableNextTab: () => {},
  callbackToNextTab: () => {},
};

export default WorkflowStepAnswers;
