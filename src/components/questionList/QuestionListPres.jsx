import React from 'react';

import QuestionListTable from './QuestionListTable';

class QuestionListPres extends React.Component {
  constructor(props) {
    super(props);

    this.onQuestionRowClick = this.onQuestionRowClick.bind(this);
  }

  onQuestionRowClick(question) {
    window.open(this.props.questionUrlFunc(question), '_self');
  }

  render() {
    return (
      <div>
        <QuestionListTable
          questions={this.props.questions}
          callbackRowClick={this.onQuestionRowClick}
        />
      </div>
    );
  }
}

export default QuestionListPres;
