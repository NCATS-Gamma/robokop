import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// import FormControl from '@material-ui/core/FormControl';
// import Select from '@material-ui/core/Select';
// import MenuItem from '@material-ui/core/MenuItem';
// import InputLabel from '@material-ui/core/InputLabel';

import Loading from '../components/loading/Loading';
import AnswersetView from '../components/shared/answersetView/AnswersetView';
import useMessageStore from '../stores/useMessageStore';

import config from '../config.json';

/**
 * Answer viewer
 * @param {object} user user object
 */
export default function Answer({ user }) {
  const { question_id } = useParams();
  const [loading, toggleLoading] = useState(true);
  const [messageSaved, setMessageSaved] = useState(false);
  // const [visibility, setVisibility] = useState(1);
  const [errorMessage, setErrorMessage] = useState('Something went wrong. Check the console for more information.');
  const messageStore = useMessageStore();

  useEffect(() => {
    if (question_id) {
      toggleLoading(true);
      let axiosConfig = {
        method: 'get',
        url: `/api/questions/${question_id}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (user) {
        axiosConfig.headers.authorization = `Bearer ${user.id_token}`;
      }
      axios.request(axiosConfig)
        .then((res) => {
          // console.log('question', res.data);
          axiosConfig = {
            method: 'get',
            url: '/api/answers',
            params: { question_id },
            headers: {
              'Content-Type': 'application/json',
            },
          };
          if (user) {
            axiosConfig.headers.authorization = `Bearer ${user.id_token}`;
          }
          axios.request(axiosConfig)
            .then((response) => {
              // console.log('answers', response.data);
              if (response.data && Array.isArray(response.data)) {
                axiosConfig = {
                  method: 'get',
                  url: `/api/answers/${response.data[0].id}`,
                  headers: {
                    'Content-Type': 'application/json',
                  },
                };
                if (user) {
                  axiosConfig.headers.authorization = `Bearer ${user.id_token}`;
                }
                axios.request(axiosConfig)
                  .then((res3) => {
                    // console.log('answer', res3.data);
                    const { knowledge_graph, results } = res3.data;
                    const query_graph = res.data;
                    const message = { query_graph, knowledge_graph, results };
                    messageStore.initializeMessage(message);
                    setMessageSaved(true);
                    toggleLoading(false);
                  })
                  .catch((err) => {
                    console.log('err', err);
                    setErrorMessage(`Unable to get answer: ${response.data[0].id}`);
                    toggleLoading(false);
                  });
              } else {
                setErrorMessage('This question has no visible answers.');
                toggleLoading(false);
              }
            })
            .catch((err) => {
              console.log('err', err);
              setErrorMessage(`Unable to retrieve answers for question: ${question_id}`);
              toggleLoading(false);
            });
        })
        .catch((err) => {
          console.log('err', err);
          setErrorMessage('Unable to load question.');
          toggleLoading(false);
        });
    }
  }, [question_id, user]);

  // useEffect(() => {
  //   console.log('visiblity set to', visibility);
  // }, [visibility]);

  return (
    <>
      {!loading ? (
        <>
          {messageSaved ? (
            <>
              {/* <FormControl>
                <InputLabel id="questionVisibility">Question Visibility</InputLabel>
                <Select
                  labelId="questionVisibility"
                  id="visibilitySelect"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <MenuItem value={1}>Private</MenuItem>
                  <MenuItem value={2}>Shareable</MenuItem>
                  <MenuItem value={3}>Public</MenuItem>
                </Select>
              </FormControl> */}
              <AnswersetView
                messageStore={messageStore}
                concepts={config.concepts}
                omitHeader
              />
            </>
          ) : (
            <h3>{errorMessage}</h3>
          )}
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
