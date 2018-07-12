import React from 'react';

import QuestionDesign from '../shared/QuestionDesign';

class WorkflowStepQuestion extends React.Component {
  next(newQuestion) {
    console.log('Getting answers for:', newQuestion);
    // this.callbackToNextTab(newQuestion);
  }

  render() {
    return (
      <QuestionDesign
        height={this.props.height}
        concepts={this.props.concepts}
        nextText="Get Answers"
        nextCallback={this.next}
        nlpParse={this.props.config.questionNewTranslate}
      />
    );
  }
}

WorkflowStepQuestion.defaultProps = {
  height: 500,
  data: {},
  variables: {},
  callbackEnableNextTab: () => {},
  callbackToNextTab: () => {},
};

export default WorkflowStepQuestion;
