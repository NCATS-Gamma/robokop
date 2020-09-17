const axios = require('axios');
const url = require('./url');

module.exports = {
  getQuestion: (req, res) => {
    const { question_id } = req.params;
    const config = {
      method: 'get',
      url: url(`api/document/${question_id}/data`),
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
        res.status(err.response.status).send(err.response.status);
      });
  },
  getQuestions: (req, res) => {
    const config = {
      method: 'get',
      url: url('api/document'),
      headers: {},
    };
    if (req.headers.authorization) {
      config.headers.authorization = req.headers.authorization;
    }
    axios.request(config)
      .then((response) => {
        res.send(response.data);
      })
      .catch((err) => {
        console.log(err);
        res.status(err.response.status).send(err.response.message);
      });
  },
  createQuestion: (req, res) => {
    const config = {
      method: 'post',
      url: url('api/document'),
      data: req.body,
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
        console.log(err);
        res.status(err.response.status).send(err.response.message);
      });
  },
  updateQuestion: (req, res) => {
    const stringedQuestion = req.file.buffer.toString();
    const { question_id } = req.params;
    const config = {
      method: 'put',
      url: url(`api/document/${question_id}/data`),
      data: stringedQuestion,
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
