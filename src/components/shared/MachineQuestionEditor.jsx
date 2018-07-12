import React from 'react';
import ReactJson from 'react-json-view';

import { Row, Col, ButtonToolbar, Button } from 'react-bootstrap';
import SplitterLayout from 'react-splitter-layout';
import MachineQuestionView from './MachineQuestionView';

class MachineQuestionEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: { question: '', machineQuestion: { nodes: [], edges: [] } },
      isValid: true,
      errorMessage: '',
    };

    this.syncStateAndProps = this.syncStateAndProps.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onAdd = this.onAdd.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.updateQuestion = this.updateQuestion.bind(this);
  }

  componentDidMount() {
    this.syncStateAndProps(this.props);
  }
  componentWillReceiveProps(nextProps) {
    // We purposefully don't do this.
    // When the parent updates (because we called update, we dont want to rerender)
    // This prevents the parent from injecting a state update while we are open, but that would be weird anyway.
    // this.syncStateAndProps(nextProps);
  }

  syncStateAndProps(newProps) {
    this.setState({ data: { question: newProps.question, machineQuestion: newProps.machineQuestion } });
  }

  onEdit(edit) {
    this.updateQuestion(edit.updated_src);
  }

  onAdd(add) {
    this.updateQuestion(add.updated_src);
  }
  onDelete(del) {
    this.updateQuestion(del.updated_src);
  }

  updateQuestion(data) {
    // Quick question validity checks (not bullet proof, just to help you out a little)
    // This is primary meant to catch graph display errors
    let isValid = true;
    let errorMessage = '';

    const iValidHaveQuestion = data && ('question' in data) && (typeof data.question === 'string');
    isValid = isValid && iValidHaveQuestion;
    if (!iValidHaveQuestion) {
      errorMessage = `${errorMessage}The graph template must have a "question" field that is a string.`;
    }
    const isValidHaveMachineQuestion = data && ('machineQuestion' in data) && (typeof data.machineQuestion === 'object');
    isValid = isValid && isValidHaveMachineQuestion;
    if (!isValidHaveMachineQuestion) {
      errorMessage = `${errorMessage}The graph template must have a "machineQuestion" field that is an object. `;
    } else {
      // We have a question

      const { machineQuestion } = data;
      // Check for nodes
      const isValidHaveNodes = 'nodes' in machineQuestion && Array.isArray(machineQuestion.nodes);
      isValid = isValid && isValidHaveNodes;
      if (!isValidHaveNodes) {
        errorMessage = `${errorMessage}A graph template requires the field "nodes" that is an array. `;
      } else {
        // question.nodes is an array
        const isValidNodesHaveIds = machineQuestion.nodes.reduce((val, n) => val && n && (typeof n === 'object') && ('id' in n), true);
        isValid = isValid && isValidNodesHaveIds;
        if (!isValidNodesHaveIds) {
          errorMessage = `${errorMessage}Each node must have an ID. `;
        } else {
          // Since every node has and id we can check if they are unique
          const nodeIds = new Set(machineQuestion.nodes.map(n => n.id));
          const isValidNodeIdsUnique = nodeIds.size === machineQuestion.nodes.length;
          if (!isValidNodeIdsUnique) {
            errorMessage = `${errorMessage}There are multiple nodes with the same ID. `;
          }
          isValid = isValid && isValidNodeIdsUnique;
        }
      }

      // Check for edges
      const isValidHaveEdges = 'edges' in machineQuestion && Array.isArray(machineQuestion.edges);
      isValid = isValid && isValidHaveEdges;
      if (!isValidHaveEdges) {
        errorMessage = `${errorMessage}A graph template requires the field "edges" that is an array.`;
      } else {
        // question.edges is an array
        const isValidEdgesHaveIds = machineQuestion.edges.reduce((val, e) => val && e && (typeof e === 'object') && ('source_id' in e) && ('target_id' in e), true);
        isValid = isValid && isValidEdgesHaveIds;
        if (!isValidEdgesHaveIds) {
          errorMessage = `${errorMessage}Each edge must have a source_id and a target_id. `;
        }
      }
    }

    this.props.onUpdate({ data, isValid });
    this.setState({ data, isValid, errorMessage });
  }

  render() {
    const { isValid, errorMessage } = this.state;
    const fullHeight = this.props.height;
    let containerStyle = {};
    if (!(fullHeight === '100%')) {
      containerStyle = { minHeight: fullHeight, maxHeight: fullHeight, overflowY: 'scroll' };
    }
    return (
      <div style={containerStyle}>
        <SplitterLayout>
          <div style={{ fontSize: 12, paddingTop: '10px', lineHeight: 1 }}>
            <ReactJson
              name={false}
              theme="rjv-default"
              collapseStringsAfterLength={15}
              indentWidth={2}
              iconStyle="triangle"
              src={this.state.data}
              onEdit={this.onEdit}
              onAdd={this.onAdd}
              onDelete={this.onDelete}
            />
          </div>
          <div>
            {isValid &&
              <MachineQuestionView
                height={fullHeight}
                concepts={this.props.concepts}
                question={this.state.data.machineQuestion}
              />
            }
            {!isValid &&
              <Row>
                <Col md={12} style={{ padding: '15px' }}>
                  <h4>
                    This graph template is not valid.
                  </h4>
                  <p>
                    {errorMessage}
                  </p>
                </Col>
              </Row>
            }
          </div>
        </SplitterLayout>
      </div>
    );
  }
}

MachineQuestionEditor.defaultProps = {
  height: '100%',
  question: {
    nodes: [],
    edges: [],
  },
  onUpdate: ({newMachineQuestion, isValid}) => {},
};

export default MachineQuestionEditor;

