const router = require('express').Router();
const multer = require('multer');
const { questions } = require('../../controllers');

const upload = multer();

// Route base is /api/questions
router.route('/')
  .get(questions.getQuestions)
  .post(questions.createQuestion);

router.route('/:question_id')
  .get(questions.getQuestion);

router.route('/:question_id/update')
  .put(upload.single('question'), questions.updateQuestion);

module.exports = router;
