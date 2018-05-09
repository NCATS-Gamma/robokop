import React from 'react';
import { Row, Col, Modal } from 'react-bootstrap';
import AnswersetInteractiveSelector from './AnswersetInteractiveSelector';
import AnswerExplorer from '../shared/AnswerExplorer';
import FeedbackEditor from '../shared/FeedbackEditor';

class AnswersetInteractive extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      feedbackModalShow: false,
      selectedSubGraphIndex: 0,
      selectedSubGraphPossibilities: [],
      selectedSubGraphEdge: null,
      nodeSelection: [],
    };

    this.renderNoAnswers = this.renderNoAnswers.bind(this);
    this.renderValid = this.renderValid.bind(this);

    this.initializeNodeSelection = this.initializeNodeSelection.bind(this);
    this.initializeStructureGroup = this.initializeStructureGroup.bind(this);
    this.selectAnswerById = this.selectAnswerById.bind(this);

    this.handleNodeSelectionChange = this.handleNodeSelectionChange.bind(this);

    this.onSelectionAnswerIndex = this.onSelectionAnswerIndex.bind(this);
    this.onSelectionCallback = this.onSelectionCallback.bind(this);
    this.onGraphClick = this.onGraphClick.bind(this);

    this.feedbackModalOpen = this.feedbackModalOpen.bind(this);
    this.feedbackModalClose = this.feedbackModalClose.bind(this);
    this.feedbackUpdate = this.feedbackUpdate.bind(this);
  }
  componentDidMount() {
    // this.updateSelectedSubGraphIndex(0);
    this.initializeStructureGroup();
    this.initializeNodeSelection();
    if (this.props.answerId && Number.isSafeInteger(this.props.answerId)) {
      this.selectAnswerById(this.props.answerId);
    }
  }
  componentWillReceiveProps(newProps) {
    // this.setState({ selectedSubGraphIndex: 0, selectedSubGraphEdge: null });
    this.initializeStructureGroup();
    this.initializeNodeSelection();
    if (newProps.answerId && Number.isSafeInteger(newProps.answerId)) {
      this.selectAnswerById(newProps.answerId);
    }
  }
  onSelectionAnswerIndex(index) {
    // We must make a nodeSelection that specifies this exact answer
    const nodeSelection = this.props.answers[index].nodes.map(n => n.id);

    this.handleNodeSelectionChange(nodeSelection);
    this.setState({ nodeSelection });
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
  initializeStructureGroup() {
    // We have answers and we need to assign each answer to a structural group based on its graph

    // Find all unique node types
    const nodeTypes = new Set();
    this.props.answers.forEach((a) => {
      const g = a.result_graph;
      g.node_list.forEach(n => nodeTypes.add(n.type));
    });
    const nodeTypesArray = Array.from(nodeTypes);

    const connectivitySet = new Set();
    this.props.answers.forEach((a) => {
      // Initialize connectivity matrix (as a vector) to all 0s
      const connectivity = [];
      for (let ij = 0; ij < (nodeTypesArray.length * nodeTypesArray.length); ij += 1) {
        connectivity.push(0);
      }

      const edges = a.result_graph.edge_list;
      const nodes = a.result_graph.node_list;
      edges.forEach((e) => {
        const sourceNode = nodes.find(n => n.id === e.source_id);
        const targetNode = nodes.find(n => n.id === e.target_id);

        const i = nodeTypesArray.findIndex(nt => nt === sourceNode.type);
        const j = nodeTypesArray.findIndex(nt => nt === targetNode.type);

        connectivity[(i * nodeTypesArray.length) + j] = 1;
      });
      let connectivityChar = '';
      connectivity.forEach((c) => {
        connectivityChar += c;
      });

      if (!connectivitySet.has(connectivityChar)) {
        // It's new!
        connectivitySet.add(connectivityChar);
        console.log('New', connectivityChar);
      } else {
        // Which one is it?
        console.log('Repeat', connectivityChar);
      }
    });

    // For each graph, form a connectivity matrix
  }
  initializeNodeSelection() {
    const noAnswers = !(('answers' in this.props) && Array.isArray(this.props.answers) && this.props.answers.length > 0);
    if (noAnswers) {
      return;
    }

    const nodeSelection = this.props.answers[0].result_graph.node_list.map(() => null);
    this.handleNodeSelectionChange(nodeSelection);
    this.setState({ nodeSelection });
  }
  selectAnswerById(answerId) {
    const index = this.props.answers.findIndex(a => a.id === answerId);
    if (Number.isSafeInteger(index) && index >= 0) {
      this.onSelectionAnswerIndex(index);
    }
  }
  handleNodeSelectionChange(nodeSelection) {
    // find all paths such that nodes match selection template
    const isKept = this.props.answers.map(s => s.result_graph.node_list.reduce((keep, n, ind) => keep && ((nodeSelection[ind] == null) || (nodeSelection[ind] === n.id)), true));

    // convert isKept into ranked lists of nodes
    // loop through path positions
    const subgraphPossibilities = this.props.answers[0].result_graph.node_list.map((n, ind) => {
      // loop through paths
      const theseNodes = this.props.answers.map((s) => {
        // extract node at position
        const n2 = s.result_graph.node_list[ind];
        n2.score = s.confidence;
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

    // Change the url, if there is exactly one possibility in each dimension
    if (this.props.enableUrlChange && (subgraphPossibilities.every(p => p.length === 1))) {
      this.props.callbackAnswerSelected(this.props.answers[selectedSubGraphIndex]);
    } else {
      this.props.callbackNoAnswerSelected();
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

  renderNoAnswers() {
    return (
      <Row>
        <Col md={12}>
          There does not appear to be any answers for this question.
        </Col>
      </Row>
    );
  }
  renderValid() {
    const answer = this.props.answers[this.state.selectedSubGraphIndex];

    // this.props.user.email
    const answerFeedback = { answerId: answer.id, accuracy: 4, impact: 3, notes: 'This is a great answer' };

    return (
      <Row className="modal-container">
        <Col md={3}>
          <AnswersetInteractiveSelector
            subgraph={answer}
            nodeSelection={this.state.nodeSelection}
            subgraphPossibilities={this.state.selectedSubGraphPossibilities}
            onSelectionCallback={this.onSelectionCallback}
          />
        </Col>
        <Col md={9}>
          <AnswerExplorer
            answer={answer}
            feedback={this.props.feedback}
            subgraphs={this.props.answers}
            selectedSubgraphIndex={this.state.selectedSubGraphIndex}
            selectedEdge={this.state.selectedSubGraphEdge}

            callbackOnGraphClick={this.onGraphClick}
            enableFeedbackSubmit={this.props.enableFeedbackSubmit}
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
              feedback={answerFeedback}
              callbackUpdate={this.feedbackUpdate}
              callbackClose={this.feedbackModalClose}
            />
          </Modal.Body>
        </Modal>
      </Row>
    );
  }
  render() {
    const hasAnswers = ('answers' in this.props) && Array.isArray(this.props.answers) && this.props.answers.length > 0;
    return (
      <div>
        {hasAnswers && this.renderValid()}
        {!hasAnswers && this.renderNoAnswers()}
      </div>
    )
  }
}

export default AnswersetInteractive;
