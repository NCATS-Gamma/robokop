import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

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
  const messageStore = useMessageStore();

  useEffect(() => {
    if (question_id && user) {
      toggleLoading(true);
      axios.get(`/api/questions/${question_id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id_token}`,
        },
      })
        .then((res) => {
          console.log('question', res.data);
          axios.request({
            method: 'get',
            url: '/api/answers',
            params: {
              question_id,
            },
            headers: {
              Authorization: `Bearer ${user.id_token}`,
            },
          })
            .then((response) => {
              console.log('answers', response.data);
              if (response.data && Array.isArray(response.data)) {
                axios.get(`/api/answers/${response.data[0].id}`, {
                  headers: {
                    Authorization: `Bearer ${user.id_token}`,
                  },
                })
                  .then((res3) => {
                    console.log('answer', res3.data);
                    const { knowledge_graph, results } = res3.data;
                    const query_graph = res.data;
                    const message = { query_graph, knowledge_graph, results };
                    messageStore.initializeMessage(message);
                    setMessageSaved(true);
                    toggleLoading(false);
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
