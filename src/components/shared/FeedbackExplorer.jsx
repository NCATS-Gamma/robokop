import React from 'react';

import { Row, Col, FormControl, Button } from 'react-bootstrap';

import FeedbackEditor from './FeedbackEditor';


class FeedbackExplorer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {

    };

    this.onEditAccuracy = this.onEditAccuracy.bind(this);
    this.onHoverAccuracy = this.onHoverAccuracy.bind(this);
    this.onHoverOffAccuracy = this.onHoverOffAccuracy.bind(this);
    this.onEditImpact = this.onEditImpact.bind(this);
    this.onHoverImpact = this.onHoverImpact.bind(this);
    this.onHoverOffImpact = this.onHoverOffImpact.bind(this);
    this.onEditNotes = this.onEditNotes.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidMount() {
    this.syncPropsAndState(this.props);
  }

  onEditAccuracy(nextValue) {
    this.setState({ editedAccuracy: true, accuracy: nextValue, displayAccuracy: nextValue });
  }
  onHoverAccuracy(nextValue) {
    this.setState({ displayAccuracy: nextValue });
  }
  onHoverOffAccuracy() {
    this.setState({ displayAccuracy: this.state.accuracy });
  }

  onEditImpact(nextValue) {
    this.setState({ editedImpact: true, impact: nextValue, displayImpact: nextValue });
  }
  onHoverImpact(nextValue) {
    this.setState({ displayImpact: nextValue });
  }
  onHoverOffImpact() {
    this.setState({ displayImpact: this.state.impact });
  }

  onEditNotes(e) {
    this.setState({ editedNotes: true, notes: e.target.value });
  }
  onSave() {
    if (!(this.state.editedAccuracy || this.state.editedImpact || this.state.editedNotes)) {
      this.props.callbackClose();
      return;
    }

    const newFeedback = {
      accuracy: this.state.accuracy,
      impact: this.state.impact,
      notes: this.state.notes,
      answer_id: this.state.answerId, // Note the _ because this is going to be in a post.
    };

    this.props.callbackUpdate(
      newFeedback,
      () => this.setState({ editedAccuracy: false, editedImpact: false, editedNotes: false }),
    );
  }

  syncPropsAndState(newProps) {
    this.setState({
      editedAccuracy: false,
      editedImpact: false,
      editedNotes: false,
      answerId: newProps.feedback.answerId,
      accuracy: newProps.feedback.accuracy,
      displayAccuracy: newProps.feedback.accuracy,
      impact: newProps.feedback.impact,
      displayImpact: newProps.feedback.impact,
      notes: newProps.feedback.notes,
    });
  }
  renderViewerEditor() {
    const canSubmit = this.props.enableSubmit;
    return (
      <div>
        Viewer Editor - {canSubmit}
      </div>
    );
  }
  renderBlank() {
    return (
      <div>
        There isn't any feedback
      </div>
    );
  }
  renderEditor() {
    return (
      <FeedbackEditor
        user={this.props.user}
        answer={this.props.answer}
        answerFeedback={this.props.answerFeedback}
        enableSubmit={this.props.enableFeedbackSubmit}
        callbackUpdate={this.feedbackUpdate}
        callbackClose={this.feedbackModalClose}
      />
    );
  }
  render() {
    const hasFeedback = (this.props.answerFeedback) && (Array.isArray(this.props.answerFeedback)) && this.props.answerFeedback.length > 0;
    return (
      <Row>
        <Col md={12}>
          {hasFeedback && this.renderViewerEditor()}
          {!hasFeedback && this.renderBlank()}
        </Col>
      </Row>
    );
  }
}

export default FeedbackExplorer;
