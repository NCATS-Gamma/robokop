import React, { useState } from 'react';
import axios from 'axios';

import { Row, Col } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import { FaCloudUploadAlt } from 'react-icons/fa';
import Snackbar from '@material-ui/core/Snackbar';

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
  const [showSnackbar, toggleSnackbar] = useState(false);
  const messageStore = useMessageStore();

  function uploadMessage() {
    const defaultQuestion = { parent: '', visibility: 0 };
    axios.request({
      method: 'post',
      url: '/api/questions',
      data: defaultQuestion,
      headers: {
        Authorization: `Bearer ${user.id_token}`,
      },
    })
      .then((resp) => {
        // console.log('created question', resp);
        const question_id = resp.data;
        const formData = new FormData();
        const blob = new Blob([JSON.stringify(messageStore.message.query_graph)], {
          type: 'application/json',
        });
        formData.append('question', blob);
        axios.request({
          method: 'put',
          url: `/api/questions/${question_id}/update`,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.id_token}`,
          },
        })
          .then((res) => {
            // console.log('question updated', res.data);
            const answerData = new FormData();
            const answerBlob = new Blob([JSON.stringify({
              knowledge_graph: messageStore.message.knowledge_graph,
              results: messageStore.message.results,
            })], {
              type: 'application/json',
            });
            answerData.append('answer', answerBlob);
            axios.request({
              url: '/api/answers',
              method: 'post',
              params: {
                question_id,
              },
              data: answerData,
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${user.id_token}`,
              },
            })
              .then((response) => {
                // console.log('answers response', response.data);
                toggleSnackbar(true);
              })
              .catch((error) => {
                console.log('answers error', error);
              });
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
              {user && (
                <button type="button" onClick={uploadMessage}>Upload</button>
              )}
              <Snackbar
                open={showSnackbar}
                onClose={() => toggleSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                message="Message saved successfully!"
              />
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
                    <section id="dropzoneContainer">
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
