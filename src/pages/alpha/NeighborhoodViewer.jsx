import React from 'react';
import AnswersetStore from '../../stores/messageAnswersetStore';
import AnswersetGraph from '../../components/answerset/AnswersetGraph';

class NeightborhoodViewer extends React.Component {
  constructor(props) {
    super(props);

    this.answersetStore = new AnswersetStore(props.data);

    this.state = {};
  }

  render() {
    const { concepts } = this.props;
    return (
      <div>
        <AnswersetGraph
          store={this.answersetStore}
          concepts={concepts}
        />
      </div>

    );
  }
}

export default NeightborhoodViewer;
