import React, { useState, useEffect } from 'react';

import { Row, Col } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import { FaCloudUploadAlt } from 'react-icons/fa';

// import AppConfig from '../AppConfig';
import Loading from '../components/shared/Loading';
import AnswersetView from '../components/shared/answersetView/AnswersetView';
// import AnswersetStore from './stores/messageAnswersetStore';
import useMessageStore from '../stores/useMessageStore';
import config from '../config.json';

const _ = require('lodash');

export default function SimpleViewer(props) {
  const { user } = props;
  // We only read the communications config on creation
  // const [appConfig, setAppConfig] = useState(new AppConfig(config));
  const [messageSaved, setMessageSaved] = useState(false);
  const [loading, toggleLoading] = useState(true);
  // const [user, setUser] = useState({});
  // const [concepts, setConcepts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Getting server data...');
  const messageStore = useMessageStore();

  function parseMessage(message) {
    const hasMessage = _.isObject(message);
    if (hasMessage && 'query_graph' in message) {
      message.question_graph = message.query_graph;
      delete message.query_graph;
    }
    let hasQGraph = hasMessage && 'question_graph' in message;
    let hasKG = hasMessage && 'knowledge_graph' in message;
    if (hasMessage && 'results' in message) {
      message.answers = message.results;
      delete message.results;
    }
    let hasAnswers = hasMessage && 'answers' in message && Array.isArray(message.answers) && message.answers.length > 0;

    let allOk = hasQGraph && hasKG && hasAnswers;

    if (allOk) {
      messageStore.setMessage(message);
      setMessageSaved(true);
      toggleLoading(false);
      setErrorMessage('');
      return;
    }

    hasQGraph = hasMessage && 'query_graph' in message;
    hasKG = hasMessage && 'knowledge_graph' in message;
    hasAnswers = hasMessage && 'results' in message && Array.isArray(message.results) && message.results.length > 0;
    allOk = hasQGraph && hasKG && hasAnswers;

    if (allOk) {
      message.results.map((result) => {
        const nodeBindings = {};
        result.node_bindings.forEach((nb) => {
          if (nb.qg_id in nodeBindings) {
            if (Array.isArray(nb.kg_id)) {
              nodeBindings[nb.qg_id].concat(nb.kg_id);
            } else {
              nodeBindings[nb.qg_id].append(nb.kg_id);
            }
          } else if (Array.isArray(nb.kg_id)) {
            nodeBindings[nb.qg_id] = nb.kg_id;
          } else {
            nodeBindings[nb.qg_id] = [nb.kg_id];
          }
        });
        result.node_bindings = nodeBindings;
        const edgeBindings = {};
        result.edge_bindings.forEach((eb) => {
          if (eb.qg_id in edgeBindings) {
            if (Array.isArray(eb.kg_id)) {
              edgeBindings[eb.qg_id].concat(eb.kg_id);
            } else {
              edgeBindings[eb.qg_id].push(eb.kg_id);
            }
          } else if (Array.isArray(eb.kg_id)) {
            edgeBindings[eb.qg_id] = eb.kg_id;
          } else {
            edgeBindings[eb.qg_id] = [eb.kg_id];
          }
        });
        result.edge_bindings = edgeBindings;
        return result;
      });
      message.question_graph = message.query_graph;
      message.answers = message.results;

      messageStore.setMessage(message);
      setMessageSaved(true);
      toggleLoading(false);
      setErrorMessage('');
      return;
    }

    let errMsg = '';
    if (!hasMessage) {
      errMsg = `${errMsg} The uploaded file does not appear to be a valid JSON object.`;
    }
    if (!hasQGraph) {
      errMsg = `${errMsg} A question_graph must be provided.`;
    }
    if (!hasKG) {
      errMsg = `${errMsg} A knowledge_graph must be provided.`;
    }
    if (!hasAnswers) {
      errMsg = `${errMsg} An answers array must be provided.`;
    }
    setMessageSaved(false);
    toggleLoading(false);
    setErrorMessage(errMsg);
  }

  function onDrop(acceptedFiles, rejectedFiles) {
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => {
        toggleLoading(true);
        setLoadingMessage('Loading Answers...');
      };
      fr.onloadend = () => toggleLoading(false);
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const object = JSON.parse(fileContents);
          parseMessage(object);
        } catch (err) {
          console.log(err);
          // window.alert('Failed to load this Answerset file. Are you sure this is valid?');
          setErrorMessage('There was the problem loading the file. Is this valid JSON?');
        }
      };
      fr.onerror = () => {
        // window.alert('Sorry but there was a problem uploading the file. The file may be invalid.');
        setErrorMessage('There was the problem loading the file. Is this valid JSON?');
      };
      fr.readAsText(file);
    });
  }

  useEffect(() => {
    // makes the appropriate GET request from server.py,
    // uses the result to set state
    // appConfig.user((data) => setUser(appConfig.ensureUser(data)));
    // appConfig.concepts((data) => setConcepts(data));

    if (props.id) {
      // request the file
      // appConfig.viewData(
      //   props.id,
      //   (object) => {
      //     parseMessage(object); // This will set state
      //   },
      //   (err) => {
      //     console.log(err);
      //     toggleLoading(false);
      //     setErrorMessage('There was a problem fetching the stored file from the server. This may be an invalid identifier.');
      //   },
      // );
    } else {
      toggleLoading(false);
    }
  }, []);

  return (
    <>
      {loading ? (
        <Row>
          <Col md={12}>
            <h1>
              {loadingMessage}
              <br />
            </h1>
            <Loading />
          </Col>
        </Row>
      ) : (
        <>
          {messageSaved && !errorMessage && (
            <AnswersetView
              user={user}
              concepts={config.concepts}
              messageStore={messageStore}
              omitHeader
            />
          )}
          {!errorMessage && !messageSaved && (
            <Row>
              <Col md={12}>
                <h1>
                  Answer Set Explorer
                  <br />
                  <small>
                    Explore answers and visualize knowledge graphs.
                  </small>
                </h1>
                <Dropzone
                  onDrop={(acceptedFiles, rejectedFiles) => onDrop(acceptedFiles, rejectedFiles)}
                  multiple={false}
                >
                  {({ getRootProps, getInputProps }) => (
                    <section>
                      <div id="dropzone" {...getRootProps()} style={{ backgroundColor: config.colors.bluegray }}>
                        <input {...getInputProps()} />
                        <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
                          <h1 style={{ fontSize: '48px' }}>
                            <FaCloudUploadAlt />
                          </h1>
                          <h3>
                            Drag and drop an answerset file, or click to browse.
                          </h3>
                        </div>
                      </div>
                    </section>
                  )}
                </Dropzone>
              </Col>
            </Row>
          )}
          {errorMessage && (
            <>
              <h1>
                There was a problem loading the file.
              </h1>
              <br />
              <p>
                {errorMessage}
              </p>
            </>
          )}
        </>
      )}
    </>
  );
}
