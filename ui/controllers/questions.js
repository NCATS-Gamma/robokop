const axios = require('axios');
const url = require('./url');

module.exports = {
  getQuestion: (req, res) => {
    const { question_id } = req.params;
    axios.get(url(`api/document/${question_id}/data`), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization,
      },
      maxBodyLength: 10000000000,
      maxContentLength: 10000000000,
    })
      .then((response) => {
        res.status(200).send(response.data);
      })
      .catch((err) => {
        res.send(err);
      });
  },
  getQuestions: (req, res) => {
    axios.get(url('api/document'), {
      headers: {
        Authorization: req.headers.authorization,
      },
      maxBodyLength: 10000000000,
      maxContentLength: 10000000000,
    })
      .then((response) => {
        // console.log('actual response', response.data);
        res.send(response.data);
      })
      .catch((err) => {
        res.send(err);
      });
  },
  createQuestion: (req, res) => {
    axios.request({
      method: 'post',
      url: url('api/document'),
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization,
      },
      maxBodyLength: 10000000000,
      maxContentLength: 10000000000,
    })
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        res.send(err);
      });
  },
  updateQuestion: (req, res) => {
    const stringedQuestion = req.file.buffer.toString();
    const { question_id } = req.params;
    axios.request({
      method: 'put',
      url: url(`api/document/${question_id}/data`),
      data: stringedQuestion,
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization,
      },
      maxBodyLength: 10000000000,
      maxContentLength: 10000000000,
    })
      .then((response) => {
        res.status(200).send(response.data);
      })
      .catch((err) => {
        res.send(err);
      });
  },
};
