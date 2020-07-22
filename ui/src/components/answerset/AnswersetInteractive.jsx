import React from 'react';
import { Row, Col, Panel } from 'react-bootstrap';
import Select from 'react-select';

import AnswersetInteractiveSelector from './AnswersetInteractiveSelector';
import AnswerExplorer from '../shared/AnswerExplorer';

const _ = require('lodash');

function initializeStructureGroup(ans) {
  try {
    // We have answers and we need to assign each answer to a structural group based on its graph

    // Find all unique node types
    const nodeTypes = new Set();
    const answers = _.cloneDeep(ans);
    ans.forEach((a) => {
      const g = a.result_graph;
      g.node_list.forEach(n => nodeTypes.add(n.type));
    });
    const nodeTypesArray = Array.from(nodeTypes);

    const someNullTypes = nodeTypesArray.some(nt => (nt == null || nt === undefined));
    if (someNullTypes) {
      throw new Error('The interactive answer browser requires types on all nodes.');
    }
    // We will keep a track of the unique connectivities
    const nodeTypeCountsArray = [];
    const connectivityArray = [];
    const connectivityHashArray = [];
    // For each answer we need to figure out which group its in.
    const answerGroup = answers.map((a) => {
      // Initialize connectivity matrix (as a vector) to all 0s
      const connectivity = [];
      for (let ij = 0; ij < (nodeTypesArray.length * nodeTypesArray.length); ij += 1) {
        connectivity.push(0);
      }

      // Form a connectivity matrix between concepts
      const edges = a.result_graph.edge_list;
      const nodes = a.result_graph.node_list;
      edges.forEach((e) => {
        if (e.type !== 'literature_co-occurrence') {
          const sourceNode = nodes.find(n => n.id === e.source_id);
          const targetNode = nodes.find(n => n.id === e.target_id);

          const i = nodeTypesArray.findIndex(nt => nt === sourceNode.type);
          const j = nodeTypesArray.findIndex(nt => nt === targetNode.type);

          connectivity[(i * nodeTypesArray.length) + j] = 1;
          connectivity[(j * nodeTypesArray.length) + i] = 1; // Undirected
        }
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
      connectivityChar += `_${nodes.length}_${nodeCountChar}`; // Tack number nodes on to the end

      const groupIndex = connectivityHashArray.indexOf(connectivityChar);
      if (groupIndex < 0) {
        // It's new!
        connectivityHashArray.push(connectivityChar);
        connectivityArray.push(connectivity);
        nodeTypeCountsArray.push(nodeTypeCount);
        return connectivityHashArray.length - 1; // The newest one
      }
      return groupIndex;
    });
    const nGroups = connectivityArray.length;
    const groups = [];
    for (let iGroup = 0; iGroup < nGroups; iGroup += 1) {
      const groupAnswers = [];
      let maxConf = -Infinity;
      for (let iAnswer = 0; iAnswer < answers.length; iAnswer += 1) {
        if (answerGroup[iAnswer] === iGroup) {
          groupAnswers.push(_.cloneDeep(answers[iAnswer]));
          if (maxConf < answers[iAnswer].confidence) {
            maxConf = answers[iAnswer].confidence;
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
        // eslint-disable-next-line no-param-reassign
        a.result_graph.node_list = newNodeList;
      });

      const nNodes = groupAnswers[0].result_graph.node_list.length;

      // Figure out if each of the answers in this group satisfies possible structure criteria
      // For now we only allow simple paths
      // This means that each edge is only used as a source or target up to twice
      // And (to cover cases with only two nodes), the set of (up to 2) edges used by node have different end points
      // All this should ignore literature-coaccurance edges
      const answerValidity = groupAnswers.map((a) => {
        // For each answer

        // Look at each node
        const nodeValidity = a.result_graph.node_list.map((n) => {
          let nTimesSource = 0;
          let nTimesTarget = 0;
          const attachedNodeIds = [];
          // Look at all the edges and find the number of times it is the source or the target
          // Also find other node_ids attached to it by those edges
          a.result_graph.edge_list.forEach((e) => {
            if (e.type !== 'literature_co-occurrence') {
              nTimesSource += (n.id === e.source_id);
              nTimesTarget += (n.id === e.target_id);

              if (n.id === e.source_id) {
                attachedNodeIds.push(e.target_id);
              }
              if (n.id === e.target_id) {
                attachedNodeIds.push(e.source_id);
              }
            }
          });

          const nEdges = (nTimesSource + nTimesTarget);
          const nUniqueAttachedNodes = new Set(attachedNodeIds).size;
          return (nEdges < 3) && (nEdges === nUniqueAttachedNodes);
        });

        return nodeValidity.every(i => i);
      });

      const isValid = answerValidity.every(i => i);

      groups.push({
        isValid,
        nNodes,
        connectivity: connectivityArray[iGroup],
        connectivityHash: connectivityHashArray[iGroup],
        maxConfidence: maxConf,
        answers: groupAnswers,
      });
    }

    return { groups, isError: false };
  } catch (err) {
    return { groups: [], isError: true, error: err };
  }
}

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
    this.initStructureGroup = this.initStructureGroup.bind(this);
    this.getAnswerIndexById = this.getAnswerIndexById.bind(this);

    this.handleNodeSelectionChange = this.handleNodeSelectionChange.bind(this);

    this.onGroupSelectionChange = this.onGroupSelectionChange.bind(this);
    this.onSelectionCallback = this.onSelectionCallback.bind(this);
  }
  componentDidMount() {
    let afterInitializationSelection = null;
    if (this.props.answerId && Number.isSafeInteger(this.props.answerId)) {
      afterInitializationSelection = this.props.answerId;
    }
    this.initStructureGroup(afterInitializationSelection);
  }
  componentWillReceiveProps(newProps) {
    const answerIdEqual = _.isEqual(this.props.answerId, newProps.answerId); // Monitored for select by parameter or page load

    if (!answerIdEqual && newProps.answerId && Number.isSafeInteger(newProps.answerId)) {
      this.initStructureGroup(newProps.answerId);
    }
  }
  onGroupSelectionChange(selection) {
    const index = selection.value;
    this.initializeNodeSelection(index);
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

  getAnswerIndexById(answerId) {
    let selectedGroupIndex = null;
    let selectedGroupWithinIndex = null;
    this.state.groups.forEach((g, groupIndex) => {
      const thisSubGroupAnswerIndex = g.answers.findIndex(a => a.id === answerId);
      if (thisSubGroupAnswerIndex >= 0) {
        selectedGroupWithinIndex = thisSubGroupAnswerIndex;
        selectedGroupIndex = groupIndex;
      }
    });

    return [selectedGroupIndex, selectedGroupWithinIndex];
  }

  initStructureGroup(afterSelection = null) {
    const groupsObj = initializeStructureGroup(this.props.answers);
    if (groupsObj.isError) {
      this.setState(groupsObj);
    } else {
      this.setState(groupsObj, () => {
        let inds = [0, null];
        if (afterSelection) {
          inds = this.getAnswerIndexById(afterSelection);
        }
        this.initializeNodeSelection(inds[0], inds[1]);
      });
    }
  }

  initializeNodeSelection(index, answerWithinIndex = null) {
    // if answerWithinIndex is supplied we will intialize with that answer selected
    if (this.state.groups.length < 1) {
      return;
    }
    const group = this.state.groups[index];
    const noAnswers = group.length < 1;
    if (noAnswers) {
      return;
    }

    let nodeSelection = [];

    if (Number.isSafeInteger(answerWithinIndex)) {
      nodeSelection = group.answers[answerWithinIndex].result_graph.node_list.map(n => n.id);
    } else {
      nodeSelection = group.answers[0].result_graph.node_list.map(() => null);
    }

    this.handleNodeSelectionChange(index, nodeSelection);
  }

  handleNodeSelectionChange(groupIndex, nodeSelection) {
    // find all paths such that nodes match selection template
    const group = this.state.groups[groupIndex];
    if (!group.isValid) {
      return;
    }
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
          {'There does not appear to be any answers for this question.'}
        </Col>
      </Row>
    );
  }
  renderValid() {
    const group = this.state.groups[this.state.groupSelection];
    const answer = group.answers[this.state.selectedSubGraphIndex];
    const answerFeedback = this.props.answersetFeedback.filter(f => f.answerId === answer.id);

    return (
      <div>
        <Col md={3} style={{ paddingRight: '5px' }}>
          <AnswersetInteractiveSelector
            subgraph={answer}
            nodeSelection={this.state.nodeSelection}
            subgraphPossibilities={this.state.selectedSubGraphPossibilities}
            onSelectionCallback={this.onSelectionCallback}
            concepts={this.props.concepts}
          />
        </Col>
        <Col md={9} style={{ paddingLeft: '5px' }}>
          <AnswerExplorer
            user={this.props.user}
            answer={answer}
            answerIndex={this.state.selectedSubGraphIndex}
            answerFeedback={answerFeedback}
            concepts={this.props.concepts}

            callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
            enableFeedbackView={this.props.enableFeedbackView}
            enableFeedbackSubmit={this.props.enableFeedbackSubmit}
            enabledAnswerLink={this.props.enabledAnswerLink}
            getAnswerUrl={this.props.getAnswerUrl}
          />
        </Col>
      </div>
    );
  }
  renderInvalid() {
    return (
      <Col md={12}>
        <p>
          Due to the complexity of the answer graphs, the interactive browser is unavailable.
        </p>
      </Col>
    );
  }
  renderGroup() {
    const group = this.state.groups[this.state.groupSelection];
    const { isValid } = group;

    const selectOptions = this.state.groups.map((g, i) => ({ value: i, label: `${i + 1} - ${g.answers.length} answers each with ${g.nNodes} nodes.` }));
    const oneGroup = selectOptions.length === 1;

    return (
      <Row>
        <Col md={12}>
          {!oneGroup &&
            <Row>
              <Col md={12}>
                <Panel style={{ margin: '10px 0 0px 0' }}>
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
                        clearable={false}
                      />
                    </Col>
                  </Panel.Body>
                </Panel>
              </Col>
            </Row>
          }
          <Row style={{ marginTop: '10px' }}>
            {isValid && this.renderValid()}
            {!isValid && this.renderInvalid()}
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
        {!isError && hasAnswers && this.renderGroup()}
        {!isError && !hasAnswers && this.renderNoAnswers()}
      </div>
    );
  }
}

AnswersetInteractive.defaultProps = {
  answersetFeedback: [],
};

export default AnswersetInteractive;
export { initializeStructureGroup };
