import React from 'react';
import ReactDOM from 'react-dom';

// Import static css, image, and font assets so that they can be found by webpack.
import 'bootstrap/dist/css/bootstrap.css'; // path search within node_modules
import 'ag-grid/dist/styles/ag-grid.css';
// import 'ag-grid/dist/styles/ag-theme-fresh.css';
import 'ag-grid/dist/styles/ag-theme-material.css';
import 'react-select/dist/react-select.css';

import Landing from './Landing';
import QuestionNew from './QuestionNew';
import Question from './Question';
import QuestionList from './QuestionList';
import Answerset from './Answerset';
import Answer from './Answer';

// Our actual CSS and other images etc.
import '../assets/css/style.css';

const $ = require('jquery');

window.jQuery = window.$ = $; // eslint-disable-line

require('bootstrap');
const config = require('../config.json');

const robokop = {
  config: config,
  landing: () => {
    ReactDOM.render(
      <Landing
        config={config}
      />,
      document.getElementById('reactEntry'),
    );
  },
  questionList: () => {
    ReactDOM.render(
      <QuestionList
        config={config}
      />,
      document.getElementById('reactEntry'),
    );
  },
  questionNew: (id) => {
    ReactDOM.render(
      <QuestionNew
        config={config}
        initializationId={id}
      />,
      document.getElementById('reactEntry'),
    );
  },
  question: (questionId) => {
    ReactDOM.render(
      <Question
        config={config}
        id={questionId}
      />,
      document.getElementById('reactEntry'),
    );
  },
  answerset: (questionId, answersetId) => {
    ReactDOM.render(
      <Answerset
        config={config}
        id={answersetId}
        questionId={questionId}
      />,
      document.getElementById('reactEntry'),
    );
  },
  answer: (questionId, answersetId, answerId) => {
    ReactDOM.render(
      <Answer
        config={config}
        setId={answersetId}
        id={answerId}
        questionId={questionId}
      />,
      document.getElementById('reactEntry'),
    );
  },
};

export { robokop };

