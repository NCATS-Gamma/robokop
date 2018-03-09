import React from 'react';
import PropTypes from 'prop-types';

import { PageHeader, Grid, Row, Col } from 'react-bootstrap';

const shortid = require('shortid');

const dateToString = d => d.toLocaleString();

class AnswersetSummary extends React.Component {
  constructor(props) {
    super(props);

    this.getOtherAnswersetContent = this.getOtherAnswersetContent.bind(this);
    this.getOtherQuestionContent = this.getOtherQuestionContent.bind(this);
  }

  getOtherAnswersetContent() {
    if (this.props.otherAnswersets.length > 0) {
      const otherLinks = this.props.otherAnswersets.map(a => (
        <li key={shortid.generate()}>
          <a href={this.props.answersetUrlFunc(a)}> {dateToString(new Date(a.timestamp))} </a>
        </li>
      ));
      return (
        <div>
          <h5>Other answer sets for this question:</h5>
          <ul>
            {otherLinks}
          </ul>
        </div>
      );
    }

    return [];
  }

  getOtherQuestionContent() {
    if (this.props.questions.length > 1) {
      const otherLinks = this.props.questions.slice(1).map(q => (
        <li key={shortid.generate()}>
          <a href={this.props.questionUrlFunc(q)}> {q.natural_question} </a>
        </li>
      ));
      return (
        <div>
          <h5>This answer set also applies to these questions:</h5>
          <ul>
            {otherLinks}
          </ul>
        </div>
      );
    }

    return [];
  }

  render() {
    const quest = this.props.questions[0];
    const answerDate = new Date(this.props.answerset.timestamp);
    return (
      <div>
        <Grid>
          <Row>
            <Col md={12}>
              <PageHeader onClick={() => window.open(this.props.questionUrlFunc(quest), '_self')} style={{cursor: 'hand'}}>
                {quest.name}
                <br />
                <small>{quest.natural_question}</small>
                <br />
              </PageHeader>
              {`Answer found ${dateToString(answerDate)}`}
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              {this.getOtherAnswersetContent()}
            </Col>
            <Col md={6}>
              {this.getOtherQuestionContent()}
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
};

AnswersetSummary.propTypes = {
  questionUrlFunc: PropTypes.func.isRequired,
  answersetUrlFunc: PropTypes.func.isRequired,
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  answerset: PropTypes.object.isRequired,
  otherAnswersets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AnswersetSummary;
