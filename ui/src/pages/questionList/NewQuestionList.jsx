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
import EmptyTable from '../../components/shared/emptyTableRows/EmptyTable';
import API from '../../API';

import './newQuestionList.css';

export default function NewQuestionList({ user }) {
  const [questions, updateQuestions] = useState([]);
  const [loading, toggleLoading] = useState(true);
  const [page, updatePage] = useState(0);
  const [rowsPerPage, updateRowsPerPage] = useState(5);

  useEffect(() => {
    let token = null;
    if (user) {
      token = user.id_token;
    }
    API.getQuestions(token)
      .then((res) => {
        let fetchedQuestions = [];
        if (Array.isArray(res.data)) {
          // TODO: there might be a new route that will get just questions
          fetchedQuestions = res.data.filter((question) => !question.parent);
        }
        updateQuestions(fetchedQuestions);
        toggleLoading(false);
      })
      .catch(() => {
        toggleLoading(false);
      });
  }, [user]);
  return (
    <>
      <h1>
        Robokop Question Library
        <br />
        {!loading && (
          <small>
            {questions.length} question{questions.length !== 1 ? 's have' : ' has'} been asked using Robokop.
          </small>
        )}
      </h1>
      {!loading ? (
        <Paper id="questionListContainer">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Question ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.length ? (
                  <>
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
                  </>
                ) : (
                  <EmptyTable numRows={5} numCells={1} />
                )}
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
      ) : (
        <Loading />
      )}
    </>
  );
}
