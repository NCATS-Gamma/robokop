import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';

// Import static css, image, and font assets so that they can be found by webpack.
import 'bootstrap/dist/css/bootstrap.css'; // path search within node_modules
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-material.css';
import 'react-select/dist/react-select.css';
import 'react-widgets/dist/css/react-widgets.css';

import 'babel-polyfill'; // For IE Promises

import Landing from './Landing';
import About from './About';
import QuestionNew from './QuestionNew';
import QuestionNewLinear from './QuestionNewLinear';
import Question from './Question';
import QuestionList from './QuestionList';
import Answerset from './Answerset';
import Workflow from './Workflow';
import AnswersetApp from './AnswersetApp';
import Comparison from './Comparison';
import Activity from './Activity';
import Search from './Search';
import MultiSearch from './MultiSearch';
import Simple from './Simple';
import Flowbokop from './Flowbokop';
import store from './stores/flowbokopStore';

// Our actual CSS and other images etc.
import '../assets/css/style.css';

const $ = require('jquery');

window.jQuery = window.$ = $; // eslint-disable-line

require('bootstrap');
const config = require('../config.json');

const robokop = {
  config,
  landing: () => {
    ReactDOM.render(
      <Landing
        config={config}
      />,
      document.getElementById('reactEntry'),
    );
  },
  about: () => {
    ReactDOM.render(
      <About
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
  questionNewLinear: (id) => {
    ReactDOM.render(
      <QuestionNewLinear
        config={config}
        initializationId={id}
      />,
      document.getElementById('reactEntry'),
    );
  },
  search: () => {
    ReactDOM.render(
      <MultiSearch
        config={config}
      />,
      document.getElementById('reactEntry'),
    );
  },
  activity: () => {
    ReactDOM.render(
      <Activity
        config={config}
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
  answerset: (answersetId, answerId) => {
    ReactDOM.render(
      <Answerset
        config={config}
        id={answersetId}
        answerId={answerId}
      />,
      document.getElementById('reactEntry'),
    );
  },
  workflow: () => {
    ReactDOM.render(
      <Workflow
        config={config}
      />,
      document.getElementById('reactEntry'),
    );
  },
  app_answerset: () => {
    ReactDOM.render(
      <AnswersetApp
        config={config}
      />,
      document.getElementById('reactEntry'),
    );
  },
  app_comparison: () => {
    ReactDOM.render(
      <Comparison
        config={config}
      />,
      document.getElementById('reactEntry'),
    );
  },
  simple: () => {
    ReactDOM.render(
      <Simple
        config={config}
      />,
      document.getElementById('reactEntry'),
    );
  },
  flowbokop: () => {
    ReactDOM.render(
      <Provider store={store}>
        <Flowbokop
          config={config}
        />
      </Provider>,
      document.getElementById('reactEntry'),
    );
  },
};

export { robokop };

