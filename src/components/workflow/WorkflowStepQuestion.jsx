import React from 'react';

import QuestionDesign from '../shared/QuestionDesign';

class WorkflowStepQuestion extends React.Component {
  constructor(props) {
    super(props);

    this.next = this.next.bind(this);
  }

  next(newQuestion) {
    this.props.callbackToNextTab(newQuestion);
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
