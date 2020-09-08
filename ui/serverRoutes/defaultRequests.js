const axios = require('axios');

const comms = axios.create();
const cancelToken = axios.CancelToken.source();

function getRequest(
  address,
  successFunction = () => {},
  failureFunction = (err) => {
    console.log('There was a problem with this GET request:');
    console.log(err);
  },
) {
  comms.get(address, { cancelToken: cancelToken.token })
    .then((res) => {
      successFunction(res.data);
    })
    .catch((err) => {
      failureFunction(err);
    });
}

function postRequest(
  address,
  data,
  successFunction = () => {},
  failureFunction = (err) => {
    console.log('There was a problem with this POST request:');
    console.log(err);
  },
) {
  comms.post(address, data)
    .then((res) => {
      successFunction(res.data);
    })
    .catch((err) => {
      failureFunction(err);
    });
}

function deleteRequest(
  address,
  successFunction = () => {},
  failureFunction = (err) => {
    console.log('There was a problem with this DELETE request:');
    console.log(err);
  },
) {
  comms.delete(address)
    .then((res) => {
      successFunction(res.data);
    })
    .catch((err) => {
      failureFunction(err);
    });
}

module.exports = {
  getRequest,
  postRequest,
  deleteRequest,
};
