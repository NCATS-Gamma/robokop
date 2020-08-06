import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import Landing from './simplePages/Landing';
import About from './simplePages/About';
import Help from './simplePages/Help';
import Guide from './simplePages/Guide';
import TermsofService from './simplePages/TermsofService';
import SimpleViewer from './simplePages/SimpleViewer';
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

import Header from './components/header/Header';
import Footer from './components/footer/Footer';
import ensureUser from './utils/ensureUser';

export default function App() {
  const [user, setUser] = useState({});
  const ensuredUser = ensureUser(user);
  return (
    <Router>
      <div id="pageContainer">
        <Header user={ensuredUser} />
        <div id="contentContainer">
          <Switch>
            <Route path="/about">
              <About />
            </Route>
            <Route path="/help">
              <Help />
            </Route>
            <Route path="/guide">
              <Guide user={ensuredUser} />
            </Route>
            <Route path="/alpha">
              <About />
            </Route>
            <Route path="/search">
              <About />
            </Route>
            <Route
              path="/simple"
              render={({ match: { url } }) => (
                <>
                  <Route path={`${url}/view`} component={() => SimpleViewer({ user: ensuredUser })} exact />
                </>
              )}
            />
            {/* <Route path="/simple">
              <Route path="/view">
                <SimpleViewer user={ensuredUser} />
              </Route>
            </Route> */}
            <Route path="/compare">
              <About />
            </Route>
            <Route path="/termsofservice">
              <TermsofService />
            </Route>
            <Route path="/">
              <Landing />
            </Route>
          </Switch>
        </div>
        <Footer />
      </div>
    </Router>
  );
}
