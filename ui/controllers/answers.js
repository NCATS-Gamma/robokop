const axios = require('axios');
const url = require('./url');

module.exports = {
  getAnswer: (req, res) => {
    const { answer_id } = req.params;
    const config = {
      method: 'get',
      url: url(`api/document/${answer_id}/data`),
      headers: {
        'Content-Type': 'application/json',
      },
      maxBodyLength: 10000000000,
      maxContentLength: 10000000000,
    };
    if (req.headers.authorization) {
      config.headers.authorization = req.headers.authorization;
    }
    axios.request(config)
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        res.status(err.response.status).send(err.response.message);
      });
  },
  getAnswers: (req, res) => {
    const { question_id } = req.query;
    const config = {
      method: 'get',
      url: url(`api/document/${question_id}/children`),
      headers: {},
      maxBodyLength: 10000000000,
      maxContentLength: 10000000000,
    };
    if (req.headers.authorization) {
      config.headers.authorization = req.headers.authorization;
    }
    axios.request(config)
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        res.status(err.response.status).send(err.response.message);
      });
  },
  createAnswer: (req, res) => {
    const stringedAnswer = req.file.buffer.toString();
    const { question_id } = req.query;
    const config = {
      method: 'post',
      url: url(`api/document/${question_id}/children`),
      data: stringedAnswer,
      headers: {
        'Content-Type': 'application/json',
      },
      maxBodyLength: 10000000000,
      maxContentLength: 10000000000,
    };
    if (req.headers.authorization) {
      config.headers.authorization = req.headers.authorization;
    }
    axios.request(config)
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        res.status(err.response.status).send(err.response.message);
      });
  },
};
