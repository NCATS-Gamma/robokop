import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col } from 'react-bootstrap';
import AnswersetSummary from './AnswersetSummary';
import AnswersetExplorer from './AnswersetExplorer';

class AnswersetPres extends React.Component {
  constructor(props) {
    super(props);

    this.callbackQuestion = this.callbackQuestion.bind(this);
    this.callbackAnswerset = this.callbackAnswerset.bind(this);
    this.callbackAnswer = this.callbackAnswer.bind(this);
  }

  callbackQuestion(question) {
    window.open(this.props.questionUrlFunc(question), '_self');
  }

  callbackAnswerset(answerset) {
    window.open(this.props.answersetUrlFunc(answerset), '_self');
  }

  callbackAnswer(answerset, answer) {
    window.open(this.props.answerUrlFunc(answerset, answer), '_self');
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <AnswersetSummary
              answerset={this.props.answerset}
              otherAnswersets={[this.props.answerset]}
              questions={this.props.questions}
              questionUrlFunc={this.props.questionUrlFunc}
              answersetUrlFunc={this.props.answersetUrlFunc}
            />
          </Col>
        </Row>
        <br />
        <Row>
          <Col md={12}>
            <AnswersetExplorer
              answers={this.props.answers}
              callbackAnswer={this.callbackAnswers}
            />
          </Col>
        </Row>
      </Grid>
    );
  }
};

AnswersetPres.propTypes = {
  questionUrlFunc: PropTypes.func.isRequired,
  answersetUrlFunc: PropTypes.func.isRequired,
  answerUrlFunc: PropTypes.func.isRequired,
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  answerset: PropTypes.object.isRequired,
  answers: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AnswersetPres;
