import React from 'react';

import { Row, Col, FormControl, Button } from 'react-bootstrap';

import StarRatingComponent from 'react-star-rating-component';


class FeedbackEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      answerId: '',
      editedAccuracy: false,
      editedImpact: false,
      editedNotes: false,
      accuracy: 0,
      displayAccuracy: 0,
      impact: 0,
      displayImpact: 0,
      notes: '',
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
  componentWillReceiveProps(newProps) {
    this.syncPropsAndState(newProps);
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
    const defaultFeedback = {
      accuracy: 0,
      impact: 0,
      notes: '',
    };

    let inFeedback = newProps.feedback;
    if (!inFeedback) {
      inFeedback = {};
    }
    const feedback = { ...defaultFeedback, ...inFeedback };

    console.log('sync', newProps, feedback, inFeedback)

    this.setState({
      editedAccuracy: false,
      editedImpact: false,
      editedNotes: false,
      answerId: newProps.answer.id,
      accuracy: feedback.accuracy,
      displayAccuracy: feedback.accuracy,
      impact: feedback.impact,
      displayImpact: feedback.impact,
      notes: feedback.notes,
    });
  }

  render() {
    const {
      displayAccuracy,
      displayImpact,
      notes,
    } = this.state;

    const edited = this.state.editedAccuracy || this.state.editedImpact || this.state.editedNotes;

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
              <h4>Impact</h4>
              <div style={{ fontSize: 32 }}>
                <StarRatingComponent
                  name="Impact" /* name of the radio input, it is required */
                  value={displayImpact} /* number of selected icon (`0` - none, `1` - first) */
                  starCount={5} /* number of icons in rating, default `5` */
                  onStarClick={this.onEditImpact} /* on icon click handler */
                  onStarHover={this.onHoverImpact}
                  onStarHoverOut={this.onHoverOffImpact}
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
