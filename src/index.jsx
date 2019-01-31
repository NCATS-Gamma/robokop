import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';

import { ApolloProvider } from 'react-apollo';
import ApolloClient, { InMemoryCache } from 'apollo-boost';

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
import Activity from './Activity';
import MultiSearch from './MultiSearch';
import SimpleViewer from './SimpleViewer';
import NewQuestionStore from './stores/newQuestionStore';

// Our actual CSS and other images etc.
import '../assets/css/style.css';

const $ = require('jquery');

window.jQuery = window.$ = $; // eslint-disable-line

require('bootstrap');
const config = require('../config.json');

const graphQlClient = new ApolloClient({
  uri: `http://${config.host}:5000/graphql`,
  cache: new InMemoryCache(),
});

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
      <ApolloProvider client={graphQlClient}>
        <QuestionList
          config={config}
        />
      </ApolloProvider>,
      document.getElementById('reactEntry'),
    );
  },
  questionNew: (id) => {
    ReactDOM.render(
      <Provider store={new NewQuestionStore()}>
        <QuestionNew
          config={config}
          initializationId={id}
        />
      </Provider>,
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
  simpleView: (id) => {
    ReactDOM.render(
      <SimpleViewer
        config={config}
        id={id}
      />,
      document.getElementById('reactEntry'),
    );
  },
};

export { robokop };

