const router = require('express').Router();
const axios = require('axios');
const url = require('../url');

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
