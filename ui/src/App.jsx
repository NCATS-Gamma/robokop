import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import Landing from './pages/Landing';
import About from './pages/About';
import Help from './pages/Help';
import Guide from './pages/Guide';
import TermsofService from './pages/TermsofService';
import SimpleViewer from './pages/SimpleViewer';
import SimpleEnriched from './pages/SimpleEnriched';
import SimpleSimilarity from './pages/SimpleSimilarity';
import SimpleExpand from './pages/SimpleExpand';
import SimpleSynonymize from './pages/SimpleSynonymize';
import SimplePublications from './pages/SimplePublications';

import Neighborhood from './pages/neighborhood/Neighborhood';
import SimpleQuestion from './pages/newQuestion/SimpleQuestion';
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
            <Route path="/neighborhood">
              <Neighborhood />
            </Route>
            <Route
              path="/simple"
              render={({ match: { url } }) => (
                <>
                  <Route path={`${url}/question`} component={() => SimpleQuestion({ concepts: {} })} exact />
                  <Route path={`${url}/view`} component={() => SimpleViewer({ user: ensuredUser })} exact />
                  <Route path={`${url}/enriched`} component={() => SimpleEnriched({ concepts: {} })} exact />
                  <Route path={`${url}/similarity`} component={() => SimpleSimilarity({ concepts: {} })} exact />
                  <Route path={`${url}/expand`} component={() => SimpleExpand({ concepts: {} })} exact />
                  <Route path={`${url}/synonymize`} component={() => SimpleSynonymize({ concepts: {} })} exact />
                  <Route path={`${url}/publications`} component={() => SimplePublications({ concepts: {} })} exact />
                </>
              )}
            />
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
