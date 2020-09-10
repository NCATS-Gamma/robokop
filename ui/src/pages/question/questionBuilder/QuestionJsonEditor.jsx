import React, { useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import { Row, Col } from 'react-bootstrap';
import { FaReply, FaCheck, FaCloudUploadAlt } from 'react-icons/fa';
import Dropzone from 'react-dropzone';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';

import QuestionGraphView from '../../../components/shared/graphs/QuestionGraphView';
import Loading from '../../../components/loading/Loading';

import config from '../../../config.json';

const questionGraphSchema = {
  question_name: '',
  query_graph: {
    nodes: [],
    edges: [],
  },
  max_connectivity: 0,
};

export default function QuestionJsonEditor(props) {
  const {
    height = '100%',
    questionStore,
    callbackSave,
    callbackCancel,
  } = props;
  const [questionGraph, updateQuestionGraph] = useState(questionGraphSchema);
  const [isValidQuestion, setIsValidQuestion] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function validateQuestionGraph(graph) {
    // Quick question validity checks (not bullet proof, just to help you out a little)
    // This is primary meant to catch graph display errors
    let isValid = true;
    let errMessage = '';

    const hasQuestionName = graph && ('question_name' in graph) && (typeof graph.question_name === 'string');
    isValid = isValid && hasQuestionName;
    if (!hasQuestionName) {
      errMessage = `${errMessage}The graph template must have a "question_name" field that is a string.`;
    }
    const hasQueryGraph = graph && ('query_graph' in graph) && (typeof graph.query_graph === 'object');
    isValid = isValid && hasQueryGraph;
    if (!hasQueryGraph) {
      errMessage = `${errMessage}The graph template must have a "query_graph" field that is an object. `;
    } else {
      // We have a question

      const { query_graph } = graph;
      // Check for nodes
      const hasNodes = 'nodes' in query_graph && Array.isArray(query_graph.nodes);
      isValid = isValid && hasNodes;
      if (!hasNodes) {
        errMessage = `${errMessage}A graph template requires the field "nodes" that is an array. `;
      } else {
        // question.nodes is an array
        const nodesHaveIds = query_graph.nodes.reduce((val, n) => val && n && (typeof n === 'object') && ('id' in n), true);
        isValid = isValid && nodesHaveIds;
        if (!nodesHaveIds) {
          errMessage = `${errMessage}Each node must have an ID. `;
        } else {
          // Since every node has and id we can check if they are unique
          const nodeIds = new Set(query_graph.nodes.map((n) => n.id));
          const hasUniqueNodeIds = nodeIds.size === query_graph.nodes.length;
          if (!hasUniqueNodeIds) {
            errMessage = `${errMessage}There are multiple nodes with the same ID. `;
          }
          isValid = isValid && hasUniqueNodeIds;
        }
      }

      // Check for edges
      const hasEdges = 'edges' in query_graph && Array.isArray(query_graph.edges);
      isValid = isValid && hasEdges;
      if (!hasEdges) {
        errMessage = `${errMessage}A graph template requires the field "edges" that is an array.`;
      } else {
        // question.edges is an array
        const edgesHaveIds = query_graph.edges.reduce((val, e) => val && e && (typeof e === 'object') && ('source_id' in e) && ('target_id' in e), true);
        isValid = isValid && edgesHaveIds;
        if (!edgesHaveIds) {
          errMessage = `${errMessage}Each edge must have a source_id and a target_id. `;
        }
      }
    }

    setIsValidQuestion(isValid);
    setErrorMessage(errMessage);
  }

  function updateQuestion(e) {
    const data = e.updated_src;
    validateQuestionGraph(data);

    updateQuestionGraph(data);
  }

  function onDrop(acceptedFiles, rejectedFiles) {
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => setThinking(true);
      fr.onloadend = () => setThinking(false);
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const object = JSON.parse(fileContents);
          validateQuestionGraph(object);
          updateQuestionGraph(object);
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

  useEffect(() => {
    if (questionStore.query_graph) {
      updateQuestionGraph(questionStore.query_graph);
    }
  }, [questionStore.query_graph]);

  const topBarHeight = 30;
  const fullHeight = height;
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
      <div
        className="staticTop"
        style={{
          marginLeft: -15,
          marginRight: -15,
          height: topBarHeight,
          boxShadow: '0px 0px 5px 0px #b3b3b3',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 5, left: 15 }}>
            <span style={{ fontSize: '18px' }} title="Revert">
              <FaReply
                style={{ cursor: !thinking ? 'pointer' : 'default' }}
                onClick={!thinking ? callbackCancel : () => {}}
              />
            </span>
          </div>
          <div style={{ position: 'absolute', top: 5, left: 40 }}>
            <span style={{ fontSize: '18px' }} title="Load">
              <Dropzone
                onDrop={(acceptedFiles, rejectedFiles) => onDrop(acceptedFiles, rejectedFiles)}
                multiple={false}
                style={{
                  border: 'none',
                }}
              >
                {({ getRootProps, getInputProps }) => (
                  <section>
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <FaCloudUploadAlt style={{ cursor: !thinking ? 'pointer' : 'default' }} />
                    </div>
                  </section>
                )}
              </Dropzone>
            </span>
          </div>
          <div style={{ position: 'absolute', marginLeft: 'auto', left: '50%' }}>
            <div
              style={{
                position: 'relative', top: 5, left: '-50%', color: '#777',
              }}
            >
              Graph Template Editor
            </div>
          </div>
          <div style={{ position: 'absolute', top: 5, right: 15 }}>
            <span style={{ fontSize: '18px', color: isValidQuestion ? '#000' : '#ddd' }} title="Save Changes">
              <FaCheck
                style={{ cursor: (!thinking && isValidQuestion) ? 'pointer' : 'default' }}
                onClick={(!thinking && isValidQuestion) ? () => callbackSave(questionGraph) : () => {}}
              />
            </span>
          </div>
        </div>
      </div>
      <div style={{ ...containerStyle, marginRight: '-15px' }}>
        {!thinking && (
          <SplitterLayout>
            <div style={{ paddingTop: '10px' }}>
              <ReactJson
                name={false}
                theme="rjv-default"
                collapseStringsAfterLength={15}
                indentWidth={2}
                iconStyle="triangle"
                src={questionGraph}
                onEdit={updateQuestion}
                onAdd={updateQuestion}
                onDelete={updateQuestion}
              />
            </div>
            <div>
              {isValidQuestion && (
                <QuestionGraphView
                  height={innerHeight}
                  concepts={config.concepts}
                  question={questionGraph.query_graph}
                />
              )}
              {!isValidQuestion && (
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
              )}
            </div>
          </SplitterLayout>
        )}
        {thinking && (
          <Loading />
        )}
      </div>
    </div>
  );
}
