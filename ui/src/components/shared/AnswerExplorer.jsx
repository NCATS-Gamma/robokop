import React from 'react';
import { Panel, Modal } from 'react-bootstrap';

import { FaExternalLink, FaCommentO } from 'react-icons/fa';

import FeedbackExplorer from '../shared/FeedbackExplorer';
import SubGraphViewer from './graphs/SubGraphViewer';
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
      selectedGraph: null,
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
      this.setState({
        selectedEdge: event.edgeObjects[0], selectedGraph: event.graph, modalShow: true, modalType: 'info',
      });
    } else { // Reset things since something else was clicked
      this.setState({
        selectedEdge: null, selectedGraph: null, modalShow: false, modalType: null,
      });
    }
  }
  feedbackModalOpen() {
    this.setState({ modalShow: true, modalType: 'feedback' });
  }
  modalClose() {
    this.setState({ modalShow: false, modalType: null });
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
    let feedbackRight = -8;
    if (this.props.enabledAnswerLink) {
      feedbackRight = 25;
    }
    const hasFeedback = (this.props.answerFeedback) && (Array.isArray(this.props.answerFeedback)) && this.props.answerFeedback.length > 0;
    const showFeedbackButton = (this.props.enableFeedbackView && hasFeedback) || this.props.enableFeedbackSubmit;
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            Answer {this.props.answerIndex + 1}
            <div className="pull-right">
              <div style={{ position: 'relative' }}>
                {showFeedbackButton &&
                  <div style={{ position: 'absolute', top: -2, right: feedbackRight }}>
                    <span style={{ fontSize: '22px' }} title="Feedback">
                      <FaCommentO style={{ cursor: 'pointer' }} onClick={this.feedbackModalOpen} />
                    </span>
                  </div>
                }
                {this.props.enabledAnswerLink &&
                  <div style={{ position: 'absolute', top: -3, right: -8 }}>
                    <span style={{ fontSize: '22px' }} title="Direct Link to Answer">
                      &nbsp;
                      <a style={{ color: '#000' }} href={this.props.getAnswerUrl(this.props.answer)}><FaExternalLink style={{ cursor: 'pointer' }} /></a>
                    </span>
                  </div>
                }
              </div>
            </div>
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ padding: 0 }}>
          <SubGraphViewer
            subgraph={this.props.answer.result_graph ? this.props.answer.result_graph : {}}
            layoutRandomSeed={this.props.answerIndex}
            callbackOnGraphClick={this.onGraphClick}
            showSupport
            varyEdgeSmoothRoundness
            concepts={this.props.concepts}
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
              <FeedbackExplorer
                user={this.props.user}
                answer={this.props.answer}
                answerFeedback={this.props.answerFeedback}
                enableSubmit={this.props.enableFeedbackSubmit}
                callbackUpdate={this.feedbackUpdate}
                callbackClose={this.modalClose}
              />
              }
              {modalIsInfo &&
              <AnswerExplorerInfo
                graph={this.state.selectedGraph}
                selectedEdge={this.state.selectedEdge}
                concepts={this.props.concepts}
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
