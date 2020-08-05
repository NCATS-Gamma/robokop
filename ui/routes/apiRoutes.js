const router = require('express').Router();
const axios = require('axios');
const dotenv = require('dotenv');
const { getRequest, postRequest, deleteRequest } = require('./defaultRequests');

dotenv.config();

const protocol = process.env.ROBOKOP_PROTOCOL;
const host = process.env.ROBOKOP_HOST;
const port = process.env.MANAGER_PORT;

const comms = axios.create();
const cancelToken = axios.CancelToken.source();

const url = (ext) => `${protocol}://${host}:${port}/${ext}`;

// matches all /api routes
router.route('/user').get(
  () => getRequest(url('api/user')),
);

module.exports = router;
