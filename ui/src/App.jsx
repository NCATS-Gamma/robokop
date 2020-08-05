import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import Landing from './simplePages/Landing';
import About from './simplePages/About';
import Help from './simplePages/Help';
// import Guide from './simplePages/Guide';
// import TermsofService from './simplePages/TermsofService';
// import MultiSearch from './simplePages/MultiSearch';
// import SimpleViewer from './simplePages/SimpleViewer';
// import SimpleEnriched from './simplePages/SimpleEnriched';
// import SimpleSimilarity from './simplePages/SimpleSimilarity';
// import SimpleExpand from './simplePages/SimpleExpand';
// import SimpleSynonymize from './simplePages/SimpleSynonymize';
// import SimplePublications from './simplePages/SimplePublications';

// import Alpha from './pages/alpha/Alpha';
// import SimpleQuestion from './pages/newQuestion/SimpleQuestion';
// import QuestionNew from './pages/newQuestion/QuestionNew';
// import Question from './pages/question/Question';
// import QuestionList from './pages/questionList/QuestionList';
// import Answerset from './pages/answers/Answerset';
// import Activity from './pages/activity/Activity';

import Header from './components/header/Header';
import Footer from './components/footer/Footer';

export default function App() {
  return (
    <Router>
      <Header user={{}} />
      <Switch>
        <Route path="/about">
          <About />
        </Route>
        <Route path="/help">
          <Help />
        </Route>
        <Route path="/guide">
          <About />
        </Route>
        <Route path="/alpha">
          <About />
        </Route>
        <Route path="/apps">
          <About />
        </Route>
        <Route path="/termsofservice">
          <About />
        </Route>
        <Route path="/activity">
          <About />
        </Route>
        <Route path="/search">
          <About />
        </Route>
        <Route path="/simple">
          <About />
        </Route>
        <Route path="/compare">
          <About />
        </Route>
        <Route path="/">
          <Landing />
        </Route>
      </Switch>
      <Footer />
    </Router>
  );
}
