import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import Loading from '../components/shared/Loading';
import AnswersetView from '../components/shared/answersetView/AnswersetView';
import useMessageStore from '../stores/useMessageStore';

import config from '../config.json';

/**
 * Answer viewer
 * @param {object} user user object
 */
export default function Answer({ user }) {
  const { question_id } = useParams();
  const [loading, toggleLoading] = useState(false);
  const [messageSaved, setMessageSaved] = useState(false);
  const messageStore = useMessageStore();

  useEffect(() => {
    if (question_id && user) {
      toggleLoading(true);
      console.time('fetch_answer');
      axios.get(`/api/questions/${question_id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id_token}`,
        },
      })
        .then((res) => {
          // console.log(res.data);
          axios.get(`/api/questions/${question_id}/answers`, {
            headers: {
              Authorization: `Bearer ${user.id_token}`,
            },
          })
            .then((response) => {
              // console.log(response.data);
              if (response.data && Array.isArray(response.data)) {
                axios.get(`/api/answers/${response.data[0].id}`, {
                  headers: {
                    Authorization: `Bearer ${user.id_token}`,
                  },
                })
                  .then((res3) => {
                    // console.log('answer', res3.data.data);
                    const { knowledge_graph, results: answers } = JSON.parse(res3.data.data);
                    const question_graph = JSON.parse(res.data.data);
                    const message = { question_graph, knowledge_graph, answers };
                    messageStore.setMessage(message);
                    setMessageSaved(true);
                    toggleLoading(false);
                    console.timeEnd('fetch_answer');
                  });
              } else {
                console.log('No answers are associated with this question');
                toggleLoading(false);
              }
            });
        });
    }
  }, [question_id, user]);

  return (
    <>
      {!loading ? (
        <>
          {messageSaved ? (
            <AnswersetView
              messageStore={messageStore}
              concepts={config.concepts}
              omitHeader
            />
          ) : (
            <p>Something went wrong.</p>
          )}
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
