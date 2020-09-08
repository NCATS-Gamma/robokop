const router = require('express').Router();
const dotenv = require('dotenv');

const questions = require('./subRoutes/questions');
const answers = require('./subRoutes/answers');

dotenv.config();

// const protocol = process.env.ROBOKOP_PROTOCOL;
// const host = process.env.ROBOKOP_HOST;
// const port = process.env.MANAGER_PORT;
// const graphqlPort = process.env.GRAPHQL_PORT_UI;

router.use('/questions', questions);
router.use('/answers', answers);

module.exports = router;
