const axios = require('axios');
const url = require('./url');

module.exports = {
  getAnswer: (req, res) => {
    const { answer_id } = req.params;
    axios.get(url(`api/document/${answer_id}/data`), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization,
      },
    })
      .then((response) => {
        res.status(200).send(response.data);
      })
      .catch((err) => {
        res.send(err);
      });
  },
  getAnswers: (req, res) => {
    const { question_id } = req.query;
    axios.request({
      method: 'GET',
      url: url(`api/document/${question_id}/children`),
      headers: {
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
  createAnswer: (req, res) => {
    const stringedAnswer = req.file.buffer.toString();
    const { question_id } = req.query;
    axios.request({
      method: 'post',
      url: url(`api/document/${question_id}/children`),
      data: stringedAnswer,
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
      .catch((error) => {
        res.send(error);
      });
  },
};
