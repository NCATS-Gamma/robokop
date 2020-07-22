import React from 'react';

import { Row, Col, FormControl, Button } from 'react-bootstrap';

import FeedbackEditor from './FeedbackEditor';


class FeedbackExplorer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {

    };

  }

  renderViewerEditor() {
    const canSubmit = this.props.enableSubmit;

    // user_id=current_user.id,
    // question_id=request.json['question_id'],
    // answer_id=request.json['answer_id'],
    // accuracy=request.json['accuracy'],
    // impact=request.json['impact'],
    // notes=request.json['notes'])

    const otherFeedback = this.props.answerFeedback.filter(f => f.user_email !== this.props.user.username);
    const userFeedback = this.props.answerFeedback.find(f => f.user_email === this.props.user.username);

    return (

      // Rendering of other user feedback is currently disabled
      <div>
        {false && otherFeedback.length>0 && this.renderOtherFeedback(otherFeedback, canSubmit)}
        {otherFeedback.length<1 && !canSubmit && this.renderBlank()}
        {canSubmit && this.renderEditor(userFeedback)}
      </div>
    );
  }
  renderBlank() {
    return (
      <div>
        <h3>
          There is no feedback for this answer.
        </h3>
      </div>
    );
  }
  renderOtherFeedback(otherFeedback, canSubmit) {
    // <AutoSizer disableHeight defaultWidth={100}>
    //   {({ width }) => (
    //     <List
    //       ref={(ref) => { this.list = ref; }}
    //       style={this.styles.list}
    //       height={listHeight}
    //       overscanRowCount={10}
    //       rowCount={rowCount}
    //       rowHeight={50}
    //       noRowsRenderer={this.noRowsRenderer}
    //       rowRenderer={this.rowRenderer}
    //       width={width}
    //     />
    //   )}
    // </AutoSizer>

    return (
      <div>
        <h3>
          Feedback from Other Users:
        </h3>
        <p>
          Table of other feedback
        </p>
        {canSubmit && <br />}
      </div>
    );
  }
  renderEditor(userFeedback) {
    console.log(userFeedback)
    return (
      <div>
        <h3>
          Your Feedback:
        </h3>
        <FeedbackEditor
          user={this.props.user}
          answer={this.props.answer}
          feedback={userFeedback}
          enableSubmit={this.props.enableFeedbackSubmit}
          callbackUpdate={this.props.callbackUpdate}
          callbackClose={this.props.callbackClose}
        />
      </div>
    );
  }
  render() {
    return (
      <Row>
        <Col md={12}>
          {this.renderViewerEditor()}
        </Col>
      </Row>
    );
  }
}

export default FeedbackExplorer;
