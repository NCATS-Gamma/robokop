import React from 'react';
import { Button, Panel, Modal } from 'react-bootstrap';
import FeedbackEditor from '../shared/FeedbackEditor';
import SubGraphViewer from './SubGraphViewer';
import AnswerExplorerInfo from './AnswerExplorerInfo';

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
      modalShow: false,
      modalType: '', // 'feedback', 'info'
    };

    this.onGraphClick = this.onGraphClick.bind(this);
    this.modalClose = this.modalClose.bind(this);
    this.feedbackModalOpen = this.feedbackModalOpen.bind(this);
    this.feedbackUpdate = this.feedbackUpdate.bind(this);
  }
  onGraphClick(event) {
    if (event.edges.length !== 0) { // Clicked on an Edge
      this.setState({ selectedEdge: event.edges[0], modalShow: true, modalType: 'info' });
    } else { // Reset things since something else was clicked
      this.setState({ selectedEdge: null, modalShow: false, modalType: null });
    }
  }
  feedbackModalOpen() {
    this.setState({ modalShow: true, modalType: 'feedback' });
  }
  modalClose() {
    this.setState({ modalShow: false, modalType: '' });
  }
  feedbackUpdate(newFeedback) {
    this.props.callbackFeedbackSubmit(newFeedback);
    this.modalClose();
  }

  render() {
    const { modalType } = this.state;
    const modalIsFeedback = modalType === 'feedback';
    const modalIsInfo = modalType === 'info';
    const modalTitle = modalIsFeedback ? 'Answer Feedback' : (modalIsInfo ? 'Edge Explorer' : '');
    // className="modal-container"
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            Answer {this.props.answerIndex + 1}
            <div className="pull-right">
              {this.props.enableFeedbackSubmit &&
                <span className="pull-right">
                  <Button onClick={() => this.props.callbackOpenFeedback()} style={{ padding: '5px' }}>
                    Feedback
                  </Button>
                </span>
              }
            </div>
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ padding: 0 }}>
          <SubGraphViewer
            subgraph={this.props.answer.result_graph}
            layoutRandomSeed={this.props.answerIndex}
            callbackOnGraphClick={this.onGraphClick}
            showSupport
          />
          <Modal
            show={this.state.modalShow}
            onHide={this.modalClose}
            container={this}
            bsSize="large"
            aria-labelledby="AnswerExplorerModal"
          >
            <Modal.Header closeButton>
              <Modal.Title id="AnswerExplorerModalTitle">{modalTitle}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {modalIsFeedback &&
              <FeedbackEditor
                feedback={this.props.feedback}
                callbackUpdate={this.feedbackUpdate}
                callbackClose={this.feedbackModalClose}
              />
              }
              {modalIsInfo &&
              <AnswerExplorerInfo
                answer={this.props.answer}
                selectedEdge={this.state.selectedEdge}
              />
              }
            </Modal.Body>
          </Modal>
        </Panel.Body>
      </Panel>
    );
  }
}

export default AnswerExplorer;
