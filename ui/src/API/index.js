import axios from 'axios';

function errorHandling(err) {
  /* eslint-disable no-console */
  let errorText = '';
  if (err.response) {
    console.log('Error Status', err.response.status);
    console.log('Error Downloading', err.response.data);
    errorText = err.response.data;
  } else if (err.request) {
    console.log('No response was received', err.request);
    errorText = 'There was no response from the server.';
  } else {
    console.log('Unknown Error', err.message);
    errorText = err.message;
  }
  return errorText;
  /* eslint-enable no-console */
}

const routes = {
  getUser: () => new Promise((resolve, reject) => {
    axios.get('/api/user')
      .then((res) => {
        console.log('user res', res);
        resolve(res.data);
      })
      .catch((err) => {
        const errorText = errorHandling(err);
        reject(errorText);
      });
  }),
  setUser: (token, username) => axios.post('/api/user', { token, username }),
  getAllQuestions: () => new Promise((resolve, reject) => {
    axios.get('/api/questions')
      .then((res) => {
        console.log('Questions', res);
        resolve(res);
      })
      .catch((err) => {
        const errorText = errorHandling(err);
        reject(errorText);
      });
  }),
};
export default routes;
