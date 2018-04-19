import React from 'react';
import { Row, Col, Modal } from 'react-bootstrap';
import AnswersetInteractiveSelector from './AnswersetInteractiveSelector';
import AnswerExplorer from '../shared/AnswerExplorer';
import FeedbackEditor from '../shared/FeedbackEditor'

class AnswersetInteractive extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      mainContent: {
        height: '70vh',
        border: '1px solid #d1d1d1',
        overflow: 'hidden',
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
      },
      listGroup: {
        paddingLeft: '2px',
        paddingRight: '2px',
        height: '100%',
        overflow: 'auto',
      },
      graph: {
        paddingLeft: '0',
        paddingRight: '0',
        height: '100%',
        overflow: 'auto',
      },
      explorer: {
        height: '100%',
        overflow: 'auto',
      },
    };
    this.state = {
      feedbackModalShow: false,
      selectedSubGraphIndex: 0,
      selectedSubGraphPossibilities: [],
      selectedSubGraphEdge: null,
      nodeSelection: [],
    };

    this.initializeNodeSelection = this.initializeNodeSelection.bind(this);
    this.handleNodeSelectionChange = this.handleNodeSelectionChange.bind(this);
    this.onSelectionCallback = this.onSelectionCallback.bind(this);
    this.onGraphClick = this.onGraphClick.bind(this);
    
    this.feedbackModalOpen = this.feedbackModalOpen.bind(this);
    this.feedbackModalClose = this.feedbackModalClose.bind(this);
    this.feedbackUpdate = this.feedbackUpdate.bind(this);
  }
  componentDidMount() {
    // this.updateSelectedSubGraphIndex(0);
    this.initializeNodeSelection();
  }
  componentWillReceiveProps(newProps) {
    // this.setState({ selectedSubGraphIndex: 0, selectedSubGraphEdge: null });
    this.initializeNodeSelection();
  }

  onSelectionCallback(index, selectedOption) {
    const { nodeSelection } = this.state;
    if (selectedOption == null) {
      nodeSelection[index] = null;
    } else {
      nodeSelection[index] = selectedOption.value;
    }

    this.handleNodeSelectionChange(nodeSelection);
    this.setState({ nodeSelection });
  }
  onGraphClick(event) {
    if (event.edges.length !== 0) { // Clicked on an Edge
      this.setState({ selectedSubGraphEdge: event.edges[0] });
    } else { // Reset things since something else was clicked
      this.setState({ selectedSubGraphEdge: null });
    }
  }

  initializeNodeSelection() {
    const nodeSelection = this.props.answers[0].nodes.map(n => null);
    this.handleNodeSelectionChange(nodeSelection);
    this.setState({ nodeSelection });
  }
  handleNodeSelectionChange(nodeSelection) {
    // find all paths such that nodes match selection template
    const isKept = this.props.answers.map(s => s.nodes.reduce((keep, n, ind) => keep && ((nodeSelection[ind] == null) || (nodeSelection[ind] === n.id)), true));

    // convert isKept into ranked lists of nodes
    // loop through path positions
    const subgraphPossibilities = this.props.answers[0].nodes.map((n, ind) => {
      // loop through paths
      const theseNodes = this.props.answers.map((s) => {
        // extract node at position
        const n2 = s.nodes[ind];
        n2.score = s.score.rank_score;
        return n2;
        // filter out user-constrained nodes
      }).filter((id, ind2) => isKept[ind2]);
      // get node ids
      const nodeIds = theseNodes.map(n2 => n2.id);
      // keep first occurrence of each node
      return theseNodes.filter((val, ind3) => nodeIds.indexOf(val.id) === ind3);
    //   return theseNodes.filter((val, ind3) => nodeNames.indexOf(val.name) === ind3);
    });

    // then update the selectedSubGraphIndex to be the 'highest' one left
    const selectedSubGraphIndex = isKept.indexOf(true);

    if (selectedSubGraphIndex !== this.state.selectedSubGraphIndex) {
      this.setState({ selectedSubGraphEdge: null });
    }

    this.setState({ selectedSubGraphIndex, selectedSubGraphPossibilities: subgraphPossibilities });
  }
  feedbackModalOpen() {
    this.setState({ feedbackModalShow: true });
  }
  feedbackModalClose() {
    this.setState({ feedbackModalShow: false });
  }
  feedbackUpdate(newFeedback) {
    console.log('New Feedback', newFeedback);
    this.feedbackModalClose();
  }

  render() {
    return (
      <Row className="modal-container">
        <Col md={3}>
          <AnswersetInteractiveSelector
            subgraph={this.props.answers[this.state.selectedSubGraphIndex]}
            subgraphPossibilities={this.state.selectedSubGraphPossibilities}
            onSelectionCallback={this.onSelectionCallback}
          />
        </Col>
        <Col md={9}>
          <AnswerExplorer
            answerset={this.props.answerset}
            subgraph={this.props.answers[this.state.selectedSubGraphIndex]}
            subgraphs={this.props.answers}
            selectedSubgraphIndex={this.state.selectedSubGraphIndex}
            selectedEdge={this.state.selectedSubGraphEdge}
            callbackOnGraphClick={this.onGraphClick}
            callbackOpenFeedback={this.feedbackModalOpen}
          />
        </Col>
        <Modal
          show={this.state.feedbackModalShow}
          onHide={this.feedbackModalClose}
          container={this}
          bsSize="large"
          aria-labelledby="FeebackModal"
        >
          <Modal.Header closeButton>
            <Modal.Title id="FeebackModal">Feedback</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FeedbackEditor
              feedback={{ accuracy: 4, interest: 3, notes: 'This one seems about right.' }}
              callbackUpdate={this.feedbackUpdate}
              callbackClose={this.feedbackModalClose}
            />
          </Modal.Body>
        </Modal>
      </Row>
    );
  }
}

export default AnswersetInteractive;
