import React from 'react';
import { Button, Panel, Modal } from 'react-bootstrap';
import FeedbackEditor from '../shared/FeedbackEditor';
import SubGraphViewer from './SubGraphViewer';

// answer={answer}
// answerIndex={this.state.selectedSubGraphIndex}
// feedback={this.props.feedback}

// callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
// enableFeedbackSubmit={this.props.enableFeedbackSubmit}


class AnswerExplorer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedEdge: null,
      feedbackModalShow: false,
    };

    this.onGraphClick = this.onGraphClick.bind(this);
    this.feedbackModalOpen = this.feedbackModalOpen.bind(this);
    this.feedbackModalClose = this.feedbackModalClose.bind(this);
    this.feedbackUpdate = this.feedbackUpdate.bind(this);
  }
  onGraphClick(event) {
    console.log(event);
    if (event.edges.length !== 0) { // Clicked on an Edge
      this.setState({ selectedEdge: event.edges[0] });
    } else { // Reset things since something else was clicked
      this.setState({ selectedEdge: null });
    }
  }
  feedbackModalOpen() {
    this.setState({ feedbackModalShow: true });
  }
  feedbackModalClose() {
    this.setState({ feedbackModalShow: false });
  }
  feedbackUpdate(newFeedback) {

    this.props.callbackFeedbackSubmit(newFeedback);
    this.feedbackModalClose();
  }

  render() {
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            Answer {this.props.answerIndex + 1}
            <div className="pull-right">
              {this.props.enableFeedbackSubmit &&
                <span className="pull-right">
                  <Button onClick={()=>this.props.callbackOpenFeedback()} style={{ padding: '5px' }}>
                    Feedback
                  </Button>
                </span>
              }
            </div>
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ padding: 0 }} className="modal-container">
          <SubGraphViewer
            subgraph={this.props.answer.result_graph}
            callbackOnGraphClick={this.onGraphClick}
          />
          <Modal
            show={this.state.feedbackModalShow}
            onHide={this.feedbackModalClose}
            container={this}
            bsSize="large"
            aria-labelledby="FeebackModal"
          >
            <Modal.Header closeButton>
              <Modal.Title id="FeebackModal">Answer Feedback</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <FeedbackEditor
                feedback={this.props.feedback}
                callbackUpdate={this.feedbackUpdate}
                callbackClose={this.feedbackModalClose}
              />
            </Modal.Body>
          </Modal>
        </Panel.Body>
      </Panel>
    );
  }
}

export default AnswerExplorer;
