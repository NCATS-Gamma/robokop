import React from 'react';

import { Modal, Row, Col, FormControl, Button } from 'react-bootstrap';

import StarRatingComponent from 'react-star-rating-component';


class FeedbackEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editedAccuracy: false,
      editedInterest: false,
      editedNotes: false,
      accuracy: 0,
      displayAccuracy: 0,
      interest: 0,
      displayInterest: 0,
      notes: '',
    };

    this.onEditAccuracy = this.onEditAccuracy.bind(this);
    this.onHoverAccuracy = this.onHoverAccuracy.bind(this);
    this.onHoverOffAccuracy = this.onHoverOffAccuracy.bind(this);
    this.onEditInterest = this.onEditInterest.bind(this);
    this.onHoverInterest = this.onHoverInterest.bind(this);
    this.onHoverOffInterest = this.onHoverOffInterest.bind(this);
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

  onEditInterest(nextValue) {
    this.setState({ editedInterest: true, interest: nextValue, displayInterest: nextValue });
  }
  onHoverInterest(nextValue) {
    this.setState({ displayInterest: nextValue });
  }
  onHoverOffInterest() {
    this.setState({ displayInterest: this.state.interest });
  }

  onEditNotes(e) {
    this.setState({ editedNotes: true, notes: e.target.value });
  }
  onSave() {
    if (!(this.state.editedAccuracy || this.state.editedInterest || this.state.editedNotes)) {
      this.props.callbackClose();
      return;
    }

    const newFeedback = {
      accuracy: this.state.accuracy,
      interest: this.state.interest,
      notes: this.state.notes,
    };

    
    this.props.callbackUpdate(
      newFeedback,
      () => this.setState({ editedAccuracy: false, editedInterest: false, editedNotes: false }),
    );
  }

  syncPropsAndState(newProps) {
    this.setState({
      editedAccuracy: false,
      editedInterest: false,
      editedNotes: false,
      accuracy: newProps.feedback.accuracy,
      displayAccuracy: newProps.feedback.accuracy,
      interest: newProps.feedback.interest,
      displayInterest: newProps.feedback.interest,
      notes: newProps.feedback.notes,
    });
  }

  render() {
    const {
      displayAccuracy,
      displayInterest,
      notes,
    } = this.state;

    const edited = this.state.editedAccuracy || this.state.editedInterest || this.state.editedNotes;

    const notesStyle = {
      minHeight: '100px',
      resize: 'vertical',
    };

    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={6}>
              <h4>Accuracy</h4>
              <div style={{ fontSize: 32 }}>
                <StarRatingComponent
                  name="Accuracy" /* name of the radio input, it is required */
                  value={displayAccuracy} /* number of selected icon (`0` - none, `1` - first) */
                  starCount={5} /* number of icons in rating, default `5` */
                  onStarClick={this.onEditAccuracy} /* on icon click handler */
                  onStarHover={this.onHoverAccuracy}
                  onStarHoverOut={this.onHoverOffAccuracy}
                  starColor="#5d7dad" /* color of selected icons, default `#ffb400` */
                  emptyStarColor="#ccc" /* color of non-selected icons, default `#333` */
                />
              </div>
            </Col>
            <Col md={6}>
              <h4>Interest</h4>
              <div style={{ fontSize: 32 }}>
                <StarRatingComponent
                  name="Interest" /* name of the radio input, it is required */
                  value={displayInterest} /* number of selected icon (`0` - none, `1` - first) */
                  starCount={5} /* number of icons in rating, default `5` */
                  onStarClick={this.onEditInterest} /* on icon click handler */
                  onStarHover={this.onHoverInterest}
                  onStarHoverOut={this.onHoverOffInterest}
                  starColor="#5d7dad" /* color of selected icons, default `#ffb400` */
                  emptyStarColor="#ccc" /* color of non-selected icons, default `#333` */
                />
              </div>
            </Col>
          </Row>
          <Row style={{ paddingTop: '10px' }}>
            <Col md={12}>
              <FormControl
                componentClass="textarea"
                placeholder="Notes"
                style={notesStyle}
                inputRef={(ref) => { this.notesRef = ref; }}
                value={notes}
                onChange={this.onEditNotes}
              />
            </Col>
          </Row>
          <Row style={{ paddingTop: '10px' }}>
            <Col md={4} mdOffset={4}>
              <Button onClick={this.onSave} style={{ width: '100%' }}>
                {edited &&
                  <span>Save</span>
                }
                {!edited &&
                  <span>OK</span>
                }
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}

export default FeedbackEditor;
