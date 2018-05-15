import React from 'react';
import { Row, Col, Panel } from 'react-bootstrap';
import Select from 'react-select/lib/Select';

import AnswersetInteractiveSelector from './AnswersetInteractiveSelector';
import AnswerExplorer from '../shared/AnswerExplorer';

const _ = require('lodash');

class AnswersetInteractive extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groups: [],
      groupSelection: 0,
      selectedSubGraphIndex: 0,
      selectedSubGraphPossibilities: [],
      nodeSelection: [],
      isError: false,
      error: null, 
    };

    this.renderNoAnswers = this.renderNoAnswers.bind(this);
    this.renderValid = this.renderValid.bind(this);

    this.initializeNodeSelection = this.initializeNodeSelection.bind(this);
    this.initializeStructureGroup = this.initializeStructureGroup.bind(this);
    this.selectAnswerById = this.selectAnswerById.bind(this);

    this.handleNodeSelectionChange = this.handleNodeSelectionChange.bind(this);

    this.onGroupSelectionChange = this.onGroupSelectionChange.bind(this);
    this.onSelectionAnswerIndex = this.onSelectionAnswerIndex.bind(this);
    this.onSelectionCallback = this.onSelectionCallback.bind(this);
  }
  componentDidMount() {
    // this.updateSelectedSubGraphIndex(0);
    this.initializeStructureGroup();
    if (this.props.answerId && Number.isSafeInteger(this.props.answerId)) {
      this.selectAnswerById(this.props.answerId);
    }
  }
  componentWillReceiveProps(newProps) {
    // this.setState({ selectedSubGraphIndex: 0, selectedSubGraphEdge: null });
    this.initializeStructureGroup();
    if (newProps.answerId && Number.isSafeInteger(newProps.answerId)) {
      this.selectAnswerById(newProps.answerId);
    }
  }
  onGroupSelectionChange(selection) {
    const index = selection.value;
    this.initializeNodeSelection(index);
  }
  onSelectionAnswerIndex(index) {
    // We must make a nodeSelection that specifies this exact answer
    console.log("fix me to be aware of groups")
    // const nodeSelection = this.props.answers[index].nodes.map(n => n.id);

    // this.handleNodeSelectionChange(this. nodeSelection);
  }
  onSelectionCallback(index, selectedOption) {
    const { nodeSelection } = this.state;
    if (selectedOption == null) {
      nodeSelection[index] = null;
    } else {
      nodeSelection[index] = selectedOption.value;
    }

    this.handleNodeSelectionChange(this.state.groupSelection, nodeSelection);
  }
  initializeStructureGroup() {
    try {
      // We have answers and we need to assign each answer to a structural group based on its graph

      // Find all unique node types
      const nodeTypes = new Set();
      this.props.answers.forEach((a) => {
        const g = a.result_graph;
        g.node_list.forEach(n => nodeTypes.add(n.type));
      });
      const nodeTypesArray = Array.from(nodeTypes);

      // We will keep a track of the unique connectivities
      const nodeTypeCountsArray = [];
      const connectivityArray = [];
      const connectivityHashArray = [];
      // For each answer we need to figure out which group its in.
      const answerGroup = this.props.answers.map((a) => {
        // Initialize connectivity matrix (as a vector) to all 0s
        const connectivity = [];
        for (let ij = 0; ij < (nodeTypesArray.length * nodeTypesArray.length); ij += 1) {
          connectivity.push(0);
        }

        // Form a connectivity matrix between concepts
        const edges = a.result_graph.edge_list;
        const nodes = a.result_graph.node_list;
        edges.forEach((e) => {
          const sourceNode = nodes.find(n => n.id === e.source_id);
          const targetNode = nodes.find(n => n.id === e.target_id);

          const i = nodeTypesArray.findIndex(nt => nt === sourceNode.type);
          const j = nodeTypesArray.findIndex(nt => nt === targetNode.type);

          connectivity[(i * nodeTypesArray.length) + j] = 1;
          connectivity[(j * nodeTypesArray.length) + i] = 1; // Undirected
        });

        // Count the types of each node
        const nodeTypeCount = nodeTypesArray.map(() => 0);
        nodes.forEach((n) => {
          const ind = nodeTypesArray.findIndex(t => t === n.type);
          if (ind > -1) {
            nodeTypeCount[ind] += 1;
          }
        });

        // Hash connectivity to a string
        let connectivityChar = '';
        connectivity.forEach((c) => {
          connectivityChar += c;
        });
        let nodeCountChar = '';
        nodeTypeCount.forEach((c, i) => {
          nodeCountChar += c;
          if (i < (nodeTypeCount.length - 1)) {
            nodeCountChar += '-';
          }
        });
        connectivityChar += `_${nodes.length}_${nodeCountChar}`; // Take number nodes on to the end

        const groupIndex = connectivityHashArray.indexOf(connectivityChar);
        if (groupIndex < 0) {
          // It's new!
          connectivityHashArray.push(connectivityChar);
          connectivityArray.push(connectivity);
          nodeTypeCountsArray.push(nodeTypeCount);
          // console.log('New', connectivityChar);
          return connectivityHashArray.length - 1; // The newest one
        }
        return groupIndex;
      });

      const nGroups = connectivityArray.length;
      const groups = [];
      for (let iGroup = 0; iGroup < nGroups; iGroup += 1) {
        const groupAnswers = [];
        let maxConf = -Infinity;
        for (let iAnswer = 0; iAnswer < this.props.answers.length; iAnswer += 1) {
          if (answerGroup[iAnswer] === iGroup) {
            groupAnswers.push(_.cloneDeep(this.props.answers[iAnswer])); // Obj copy using spread
            if (maxConf < this.props.answers[iAnswer].confidence) {
              maxConf = this.props.answers[iAnswer].confidence;
            }
          }
        }

        // Get the order of types for the first answer in this group
        const typeOrder = groupAnswers[0].result_graph.node_list.map(n => n.type);

        // Resort all answers in this group so that the types go in the same order
        groupAnswers.forEach((a) => {
          const newNodeList = [];
          typeOrder.forEach((t) => {
            a.result_graph.node_list.forEach((n) => {
              if (n.type === t) {
                newNodeList.push(n);
              }
            });
          });
          a.result_graph.node_list = newNodeList;
        });

        const nNodes = groupAnswers[0].result_graph.node_list.length;

        groups.push({
          nNodes,
          connectivity: connectivityArray[iGroup],
          connectivityHash: connectivityHashArray[iGroup],
          maxConfidence: maxConf,
          answers: groupAnswers,
        });
      }

      this.setState({ groups });
      this.initializeNodeSelection(0);
    } catch (err) {
      this.setState({ groups: [], isError: true, error: err })
    }
  }

  initializeNodeSelection(index) {
    if (this.state.groups.length < 1) {
      return;
    }
    const group = this.state.groups[index];
    const noAnswers = group.length < 1;
    if (noAnswers) {
      return;
    }

    const nodeSelection = group.answers[0].result_graph.node_list.map(() => null);
    this.handleNodeSelectionChange(index, nodeSelection);
  }
  selectAnswerById(answerId) {
    console.log("Fix this to be aware of groups!!!")
    const index = this.props.answers.findIndex(a => a.id === answerId);
    if (Number.isSafeInteger(index) && index >= 0) {
      this.onSelectionAnswerIndex(index);
    }
  }
  handleNodeSelectionChange(groupIndex, nodeSelection) {
    // find all paths such that nodes match selection template
    const group = this.state.groups[groupIndex];
    const isKept = group.answers.map(s => s.result_graph.node_list.reduce((keep, n, ind) => keep && ((nodeSelection[ind] == null) || (nodeSelection[ind] === n.id)), true));

    // convert isKept into ranked lists of nodes
    // loop through path positions
    const subgraphPossibilities = group.answers[0].result_graph.node_list.map((n, ind) => {
      // loop through paths
      const theseNodes = group.answers.map((s) => {
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

    this.setState({
      groupSelection: groupIndex,
      nodeSelection,
      selectedSubGraphIndex,
      selectedSubGraphPossibilities: subgraphPossibilities,
    });

    // Change the url, if there is exactly one possibility in each dimension
    if (subgraphPossibilities.every(p => p.length === 1)) {
      this.props.callbackAnswerSelected(group.answers[selectedSubGraphIndex]);
    } else {
      this.props.callbackNoAnswerSelected();
    }
  }
  renderError() {
    console.log('Interactive Viewer Error Message', this.state.error);
    return (
      <Row>
        <Col md={12}>
          <h4>
            {'Sorry but we ran in to problems setting up the interactive viewer for this answer set.'}
          </h4>
          <p>
            Error Message:
          </p>
          <pre>
            {this.state.error.message}
          </pre>
        </Col>
      </Row>
    );
  }
  renderNoAnswers() {
    return (
      <Row>
        <Col md={12}>
          {"There does not appear to be any answers for this question."}
        </Col>
      </Row>
    );
  }
  renderValid() {
    const group = this.state.groups[this.state.groupSelection];
    const answer = group.answers[this.state.selectedSubGraphIndex];

    const selectOptions = this.state.groups.map((g, i) => {
      return { value: i, label: `${i + 1} - ${g.answers.length} answers each with ${g.nNodes} nodes.` };
    });
    const oneGroup = selectOptions.length === 1;

    const answerFeedback = { answerId: answer.id, accuracy: 4, impact: 3, notes: 'This is a great answer' };

    return (
      <Row>
        <Col md={12}>
          {!oneGroup &&
            <Row>
              <Col md={12}>
                <Panel>
                  <Panel.Heading>
                    <Panel.Title componentClass="h3">Multiple Answer Structures Found</Panel.Title>
                  </Panel.Heading>
                  <Panel.Body>
                    <Col md={6}>
                      <p>
                        The interactive viewer supports a single structure at a time. Please select a structure group to explore.
                      </p>
                    </Col>
                    <Col md={6}>
                      <Select
                        name="structure_select"
                        value={selectOptions[this.state.groupSelection].value}
                        onChange={this.onGroupSelectionChange}
                        options={selectOptions}
                      />
                    </Col>
                  </Panel.Body>
                </Panel>
              </Col>
            </Row>
          }
          <Row>
            <Col md={3} style={{ paddingRight: 0 }}>
              <AnswersetInteractiveSelector
                subgraph={answer}
                nodeSelection={this.state.nodeSelection}
                subgraphPossibilities={this.state.selectedSubGraphPossibilities}
                onSelectionCallback={this.onSelectionCallback}
              />
            </Col>
            <Col md={9} style={{ paddingLeft: 0 }}>
              <AnswerExplorer
                answer={answer}
                answerIndex={this.state.selectedSubGraphIndex}
                feedback={answerFeedback}

                callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
                enableFeedbackSubmit={this.props.enableFeedbackSubmit}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
  render() {
    const { isError } = this.state;
    const hasAnswers = (this.state.groups.length > 0 && this.state.groups[this.state.groupSelection] && this.state.groups[this.state.groupSelection].answers.length > 0);

    return (
      <div>
        {isError && this.renderError()}
        {!isError && hasAnswers && this.renderValid()}
        {!isError && !hasAnswers && this.renderNoAnswers()}
      </div>
    );
  }
}

export default AnswersetInteractive;
