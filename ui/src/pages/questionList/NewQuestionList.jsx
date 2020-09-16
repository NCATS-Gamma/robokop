import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';

import Loading from '../../components/loading/Loading';

import './newQuestionList.css';

export default function NewQuestionList({ user }) {
  const [questions, updateQuestions] = useState([]);
  const [loading, toggleLoading] = useState(true);
  const [page, updatePage] = useState(0);
  const [rowsPerPage, updateRowsPerPage] = useState(5);

  useEffect(() => {
    if (user) {
      toggleLoading(true);
      axios.get('/api/questions', {
        headers: {
          Authorization: `Bearer ${user.id_token}`,
        },
      })
        .then((res) => {
          updateQuestions(res.data);
          toggleLoading(false);
        })
        .catch((err) => {
          console.log('questions error', err);
          toggleLoading(false);
        });
    }
  }, [user]);
  return (
    <>
      <h1>
        Robokop Question Library
        <br />
        {!loading && (
          <small>
            {questions.length} questions have been asked using Robokop.
          </small>
        )}
      </h1>
      {!loading ? (
        <>
          {!user && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ display: 'inline-block', marginRight: '20px' }}>
                You aren&apos;t signed in. Please sign in to save your questions.
              </p>
              <Link to="/simple/quesiton">
                Ask a Quick Question
              </Link>
            </div>
          )}
          {!questions.length ? (
            <div>
              <p>
                You don&apos;t seem to have any questions of your own yet.
              </p>
              <Link to="/q/new">
                Ask a Question
              </Link>
              <br />
              <br />
            </div>
          ) : (
            <Paper id="questionListContainer">
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Question ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((question) => (
                        <TableRow key={question.id}>
                          <TableCell scope="row">
                            <Link to={`/question/${question.id}`}>
                              {question.id}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={questions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={(e, newPage) => updatePage(newPage)}
                onChangeRowsPerPage={(e) => {
                  updateRowsPerPage(parseInt(e.target.value, 10));
                  updatePage(0);
                }}
              />
            </Paper>
          )}
        </>
      ) : (
        <Loading />
      )}
    </>
  );
}
