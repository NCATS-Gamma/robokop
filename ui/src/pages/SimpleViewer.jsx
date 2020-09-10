import React, { useState } from 'react';
import axios from 'axios';

import { Row, Col } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import { FaCloudUploadAlt } from 'react-icons/fa';

// import AppConfig from '../AppConfig';
import Loading from '../components/loading/Loading';
import AnswersetView from '../components/shared/answersetView/AnswersetView';
// import AnswersetStore from './stores/messageAnswersetStore';
import useMessageStore from '../stores/useMessageStore';
import config from '../config.json';
import parseMessage from '../utils/parseMessage';

export default function SimpleViewer(props) {
  const { user } = props;
  // We only read the communications config on creation
  // const [appConfig, setAppConfig] = useState(new AppConfig(config));
  const [messageSaved, setMessageSaved] = useState(false);
  const [loading, toggleLoading] = useState(false);
  // const [user, setUser] = useState({});
  // const [concepts, setConcepts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const messageStore = useMessageStore();

  function uploadMessage() {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(messageStore.message.question_graph)], {
      type: 'application/json',
    });
    formData.append('question', blob);
    axios.post('/api/questions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${user.id_token}`,
      },
    })
      .then((res) => {
        const question_id = res.data;
        console.log('question id', res.data);
        const answerData = new FormData();
        const answerBlob = new Blob([JSON.stringify({
          knowledge_graph: messageStore.message.knowledge_graph,
          results: messageStore.message.answers,
        })], {
          type: 'application/json',
        });
        answerData.append('answer', answerBlob);
        axios.post(`/api/questions/${question_id}/answers`, answerData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.id_token}`,
          },
        })
          .then((response) => {
            console.log('answers response', response.data);
          })
          .catch((error) => {
            console.log('answers error', error);
          });
      });
  }

  function onDrop(acceptedFiles) {
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => {
        toggleLoading(true);
        setMessageSaved(false);
        setLoadingMessage('Loading Answers...');
      };
      // fr.onloadend = () => toggleLoading(false);
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const message = JSON.parse(fileContents);
          const parsedMessage = parseMessage(message);
          messageStore.initializeMessage(parsedMessage);
          setMessageSaved(true);
        } catch (err) {
          console.log(err);
          // window.alert('Failed to load this Answerset file. Are you sure this is valid?');
          setErrorMessage('There was the problem loading the file. Is this valid JSON?');
        }
        toggleLoading(false);
      };
      fr.onerror = () => {
        // window.alert('Sorry but there was a problem uploading the file. The file may be invalid.');
        setErrorMessage('There was the problem loading the file. Is this valid JSON?');
      };
      fr.readAsText(file);
    });
  }

  return (
    <>
      {loading ? (
        <>
          <h1>
            {loadingMessage}
            <br />
          </h1>
          <Loading />
        </>
      ) : (
        <>
          {messageSaved && !errorMessage && (
            <>
              <AnswersetView
                user={user}
                concepts={config.concepts}
                messageStore={messageStore}
                omitHeader
              />
              <button type="button" onClick={uploadMessage}>Upload</button>
            </>
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
                  accept="application/json"
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
