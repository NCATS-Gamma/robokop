const router = require('express').Router();
const axios = require('axios');
const multer = require('multer');
const url = require('../url');

const upload = multer();

router.route('/')
  .get((req, res) => {
    const { question_id } = req.query;
    axios.request({
      method: 'GET',
      url: url('api/answers'),
      params: {
        question_id,
      },
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
  })
  .post(upload.single('answer'),
    (req, res) => {
      const stringedAnswer = req.file.buffer.toString();
      const { question_id } = req.query;
      axios.request({
        method: 'post',
        url: url('api/answers'),
        params: {
          question_id,
        },
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
    });

router.route('/:answer_id')
  .get((req, res) => {
    const { answer_id } = req.params;
    axios.get(url(`api/answers/${answer_id}`), {
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
  });

module.exports = router;
