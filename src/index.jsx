import React from 'react';
import ReactDOM from 'react-dom';

import Landing from './Landing';
import Account from './Account';
import Admin from './Admin';
import QuestionNew from './QuestionNew';
import Question from './Question';
import QuestionList from './QuestionList';
import Answerset from './Answerset';
import Answer from './Answer';

// Import static css, image, and font assets so that they can be found by webpack.
import 'bootstrap/dist/css/bootstrap.css'; // path search within node_modules
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-fresh.css';
import 'react-select/dist/react-select.css';

// Our actual CSS and other images etc.
import '../assets/css/style.css';

const $ = require('jquery');
window.jQuery = window.$ = $; // eslint-disable-line
require('bootstrap');
const config = require('../config.json');

const robokop = {
  config: config,
  landing: () => {
    ReactDOM.render(<Landing
      config={config}
    />,
    document.getElementById('reactEntry'));
  },
  account: (username) => {
    ReactDOM.render(<Account
      config={config}
    />,
    document.getElementById('reactEntry'));
  },
  questionList: () => {
    ReactDOM.render(<QuestionList
      config={config}
    />,
    document.getElementById('reactEntry'));
  },
  questionNew: () => {
    ReactDOM.render(<QuestionNew
      config={config}
    />,
    document.getElementById('reactEntry'));
  },
  question: (questionId) => {
    ReactDOM.render(<Question
      config={config}
      id={questionId}
    />,
    document.getElementById('reactEntry'));
  },
  answerset: (answersetId) => {
    ReactDOM.render(<Answerset
      config={config}
      id={answersetId}
    />,
    document.getElementById('reactEntry'));
  },
  answer: (answersetId, answerId) => {
    ReactDOM.render(<Answer
      config={config}
      setId={answersetId}
      id={answerId}
    />,
    document.getElementById('reactEntry'));
  },
  admin: (answersetId) => {
    ReactDOM.render(<Admin
      config={config}
    />,
    document.getElementById('reactEntry'));
  },
};

export { robokop }
