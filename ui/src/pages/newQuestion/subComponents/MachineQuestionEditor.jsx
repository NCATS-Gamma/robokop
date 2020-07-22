import React from 'react';
import ReactJson from 'react-json-view';

import { Row, Col } from 'react-bootstrap';
import { FaMailReply, FaCheck, FaCloudUpload } from 'react-icons/fa';
import Dropzone from 'react-dropzone';

import SplitterLayout from 'react-splitter-layout';
import MachineQuestionView from '../../shared/graphs/MachineQuestionView';
import Loading from '../../Loading';

class MachineQuestionEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: { natural_question: '', machine_question: { nodes: [], edges: [] } },
      isValid: false,
      thinking: false,
      errorMessage: '',
    };

    this.syncStateAndProps = this.syncStateAndProps.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onAdd = this.onAdd.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.updateQuestion = this.updateQuestion.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onDrop = this.onDrop.bind(this);
  }

  componentDidMount() {
    this.syncStateAndProps(this.props);
  }

  syncStateAndProps(newProps) {
    this.setState({ data: { natural_question: newProps.question, machine_question: newProps.machineQuestion, max_connectivity: newProps.max_connectivity }, isValid: true });
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

    const iValidHaveQuestion = data && ('natural_question' in data) && (typeof data.natural_question === 'string');
    isValid = isValid && iValidHaveQuestion;
    if (!iValidHaveQuestion) {
      errorMessage = `${errorMessage}The graph template must have a "natural_question" field that is a string.`;
    }
    const isValidHaveMachineQuestion = data && ('machine_question' in data) && (typeof data.machine_question === 'object');
    isValid = isValid && isValidHaveMachineQuestion;
    if (!isValidHaveMachineQuestion) {
      errorMessage = `${errorMessage}The graph template must have a "machine_question" field that is an object. `;
    } else {
      // We have a question

      const { machine_question } = data;
      // Check for nodes
      const isValidHaveNodes = 'nodes' in machine_question && Array.isArray(machine_question.nodes);
      isValid = isValid && isValidHaveNodes;
      if (!isValidHaveNodes) {
        errorMessage = `${errorMessage}A graph template requires the field "nodes" that is an array. `;
      } else {
        // question.nodes is an array
        const isValidNodesHaveIds = machine_question.nodes.reduce((val, n) => val && n && (typeof n === 'object') && ('id' in n), true);
        isValid = isValid && isValidNodesHaveIds;
        if (!isValidNodesHaveIds) {
          errorMessage = `${errorMessage}Each node must have an ID. `;
        } else {
          // Since every node has and id we can check if they are unique
          const nodeIds = new Set(machine_question.nodes.map(n => n.id));
          const isValidNodeIdsUnique = nodeIds.size === machine_question.nodes.length;
          if (!isValidNodeIdsUnique) {
            errorMessage = `${errorMessage}There are multiple nodes with the same ID. `;
          }
          isValid = isValid && isValidNodeIdsUnique;
        }
      }

      // Check for edges
      const isValidHaveEdges = 'edges' in machine_question && Array.isArray(machine_question.edges);
      isValid = isValid && isValidHaveEdges;
      if (!isValidHaveEdges) {
        errorMessage = `${errorMessage}A graph template requires the field "edges" that is an array.`;
      } else {
        // question.edges is an array
        const isValidEdgesHaveIds = machine_question.edges.reduce((val, e) => val && e && (typeof e === 'object') && ('source_id' in e) && ('target_id' in e), true);
        isValid = isValid && isValidEdgesHaveIds;
        if (!isValidEdgesHaveIds) {
          errorMessage = `${errorMessage}Each edge must have a source_id and a target_id. `;
        }
      }
    }

    this.props.onUpdate({ data, isValid });
    this.setState({ data, isValid, errorMessage });
  }
  onCancel() {
    this.props.callbackCancel(); // Nothing special just call the callback
  }
  onSave() {
    // Call the callback with local state
    this.props.callbackSave({ data: this.state.data, isValid: this.state.isValid });
  }

  onDrop(acceptedFiles, rejectedFiles) {
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => this.setState({ thinking: true });
      fr.onloadend = () => this.setState({ thinking: false });
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const object = JSON.parse(fileContents);
          const { data } = this.state;
          if ('natural_question' in object) {
            data.natural_question = object.natural_question;
          }
          if ('machine_question' in object) {
            data.machine_question = object.machine_question;
          }

          this.setState({ data });
        } catch (err) {
          console.log(err);
          window.alert('Failed to read this graph template. Are you sure this is valid?');
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file. The file may be invalid JSON.');
      };
      fr.readAsText(file);
    });
  }


  render() {
    const topBarHeight = 30;
    const {
      isValid, errorMessage, thinking, data,
    } = this.state;
    const fullHeight = this.props.height;
    let innerHeight = fullHeight;
    let containerStyle = { position: 'relative' };
    if (!(fullHeight === '100%')) {
      if (!(typeof innerHeight === 'string' || innerHeight instanceof String)) {
        // innerHeight is not string subtract topBarHeight for the bar height
        innerHeight -= topBarHeight;
      }
      containerStyle = { ...containerStyle, height: innerHeight, overflowY: 'hidden' };
    }

    return (
      <div
        className="machine-question-editor"
        style={{ height: fullHeight }}
      >
        <div className="staticTop" style={{ marginLeft: -15, marginRight: -15, height: topBarHeight, boxShadow: '0px 0px 5px 0px #b3b3b3' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 5, left: 15 }}>
              <span style={{ fontSize: '18px' }} title="Revert">
                <FaMailReply style={{ cursor: !thinking ? 'pointer' : 'default' }} onClick={!thinking ? this.onCancel : () => {}} />
              </span>
            </div>
            <div style={{ position: 'absolute', top: 5, left: 40 }}>
              <span style={{ fontSize: '18px' }} title="Load">
                <Dropzone
                  onDrop={(acceptedFiles, rejectedFiles) => this.onDrop(acceptedFiles, rejectedFiles)}
                  multiple={false}
                  style={{
                    border: 'none',
                  }}
                >
                  <FaCloudUpload style={{ cursor: !thinking ? 'pointer' : 'default' }} />
                </Dropzone>
              </span>
            </div>
            <div style={{ position: 'absolute', marginLeft: 'auto', left: '50%' }}>
              <div style={{ position: 'relative', top: 5, left: '-50%', color: '#777' }}>
                Graph Template Editor
              </div>
            </div>
            <div style={{ position: 'absolute', top: 5, right: 15 }}>
              <span style={{ fontSize: '18px', color: isValid ? '#000' : '#ddd' }} title="Save Changes">
                <FaCheck style={{ cursor: (!thinking && isValid) ? 'pointer' : 'default' }} onClick={(!thinking && isValid) ? this.onSave : () => {}} />
              </span>
            </div>
          </div>
        </div>
        <div style={{ ...containerStyle, marginRight: '-15px' }}>
          {!thinking &&
            <SplitterLayout>
              <div style={{ paddingTop: '10px' }}>
                <ReactJson
                  name={false}
                  theme="rjv-default"
                  collapseStringsAfterLength={15}
                  indentWidth={2}
                  iconStyle="triangle"
                  src={data}
                  onEdit={this.onEdit}
                  onAdd={this.onAdd}
                  onDelete={this.onDelete}
                />
              </div>
              <div>
                {isValid &&
                  <MachineQuestionView
                    height={innerHeight}
                    concepts={this.props.concepts}
                    question={data.machine_question}
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
          }
          {thinking &&
            <Loading />
          }
        </div>
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
  callbackSave: () => {},
  callbackCancel: () => {},
  onUpdate: ({newMachineQuestion, isValid}) => {},
};

export default MachineQuestionEditor;

