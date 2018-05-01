import React from 'react';
import PropTypes from 'prop-types';

import { Grid } from 'react-bootstrap';
import QuestionHeader from '../shared/QuestionHeader';
import AnswersetInteractive from './AnswersetInteractive';


class AnswersetPres extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <Grid>
        <QuestionHeader
          question={this.props.question}
          answerset={this.props.answerset}
          
          showOtherQuestions
          otherQuestions={this.props.otherQuestions}
          callbackQuestionSelect={this.props.callbackQuestionSelect}
          showOtherAnswersets
          otherAnswersets={this.props.otherAnswersets}
          callbackAnswersetSelect={this.props.callbackAnswersetSelect}
        />
        <br />
        <AnswersetInteractive
          answers={this.props.answers}
          answerId={this.props.answerId} // Monitored for select by parameter or page load
          callbackAnswerSelected={this.props.callbackAnswerSelect}
          callbackNoAnswerSelected={this.props.callbackNoAnswerSelect}
        />
      </Grid>
    );
  }
};

AnswersetPres.propTypes = {
  callbackAnswersetSelect: PropTypes.func.isRequired,
  callbackQuestionSelect: PropTypes.func.isRequired,
  callbackAnswerSelect: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  otherQuestions: PropTypes.arrayOf(PropTypes.object).isRequired,
  answerset: PropTypes.object.isRequired,
  otherAnswersets: PropTypes.arrayOf(PropTypes.object).isRequired,
  answers: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AnswersetPres;
