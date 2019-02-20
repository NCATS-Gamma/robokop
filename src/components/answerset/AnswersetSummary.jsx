import React from 'react';
import PropTypes from 'prop-types';

import { PageHeader, Grid, Row, Col } from 'react-bootstrap';

const shortid = require('shortid');

const timeStampToString = (ts) => {
  let ts2 = ts;
  if (!ts.endsWith('Z')) {
    ts2 = `${ts}Z`;
  }
  const d = new Date(ts2);
  return d.toLocaleString();
};

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
          <a href={this.props.answersetUrlFunc(a)}> {timeStampToString(a.timestamp)} </a>
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
    const answerTimestamp = this.props.answerset.timestamp;
    return (
      <div>
        <Grid>
          <Row>
            <Col md={12}>
              <PageHeader onClick={() => window.open(this.props.questionUrlFunc(quest), '_self')} style={{ cursor: 'hand' }}>
                {quest.name}
                <br />
                <small>{quest.natural_question}</small>
                <br />
              </PageHeader>
            </Col>
          </Row>
          <Row>
            {`Answer found ${timeStampToString(answerTimestamp)}`}
          </Row>
        </Grid>
      </div>
    );
  }
}

AnswersetSummary.propTypes = {
  answerset: PropTypes.object.isRequired,
  answersetUrlFunc: PropTypes.func.isRequired,
  otherAnswersets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AnswersetSummary;
