import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col } from 'react-bootstrap';

class AnswersetSummary extends React.Component {
  constructor(props) {
    super(props);


  }

  render() {
    return (
      <div>
        <h1>Answer Set Summary:</h1>
      </div>
    );
  }
};

AnswersetSummary.propTypes = {
  questionUrlFunc: PropTypes.func.isRequired,
  answersetUrlFunc: PropTypes.func.isRequired,
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  answerset: PropTypes.object.isRequired,
};

export default AnswersetSummary;
