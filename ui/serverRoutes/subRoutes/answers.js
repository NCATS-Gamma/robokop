const router = require('express').Router();
const multer = require('multer');
const { answers } = require('../../controllers');

const upload = multer();

router.route('/')
  .get(answers.getAnswers)
  .post(upload.single('answer'), answers.createAnswer);

router.route('/:answer_id')
  .get(answers.getAnswer);

module.exports = router;
