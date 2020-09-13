const router = require('express').Router();
const axios = require('axios');
const multer = require('multer');
const url = require('../url');

const upload = multer();

// Route base is /api/questions
router.route('/')
  .get((req, res) => {
    axios.get(url('api/questions'), {
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
  })
  .post(upload.single('question'),
    (req, res) => {
      const stringedQuestion = req.file.buffer.toString();
      console.log(stringedQuestion);
      axios.request({
        method: 'POST',
        url: url('api/questions'),
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
    });

router.route('/:question_id')
  .get((req, res) => {
    const { question_id } = req.params;
    axios.get(url(`api/questions/${question_id}`), {
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
  });

module.exports = router;
