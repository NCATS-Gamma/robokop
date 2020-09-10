import React, { useState, useEffect } from 'react';
import { DropdownList, SelectList } from 'react-widgets';
import {
  Grid, Row, Col, Form, FormGroup, Button,
} from 'react-bootstrap';

import useMessageStore from '../stores/useMessageStore';
import Loading from '../components/loading/Loading';
import HelpButton from '../components/shared/HelpButton';
import AnswersTable from '../components/shared/answersetView/answersTable/AnswersTable';
import CurieSelectorContainer from '../components/shared/curies/CurieSelectorContainer';
import entityNameDisplay from '../utils/entityNameDisplay';

import useSimpleStore from '../stores/useSimpleStore';
import config from '../config.json';

export default function SimpleExpand() {
  const messageStore = useMessageStore();
  const simpleStore = useSimpleStore({ maxResults: 250 });
  const [maxConnect, setMaxConnect] = useState(0);
  const [predicate, updatePredicate] = useState([]);
  const [direction, setDirection] = useState('out');
  const [predicateList, setPredicateList] = useState([]);

  function getPredicateList() {
    const { type1, type2, identifier } = simpleStore;
    let tempPredicateList = [];
    if (type1 && type2 && identifier) {
      tempPredicateList = [...new Set(predicateList[type1][type2])];
    }
    setPredicateList(tempPredicateList);
  }

  useEffect(() => {
    // config.getPredicates();
  }, []);

  function getResults(event) {
    event.preventDefault();
    simpleStore.setLoading(true);
    simpleStore.setReady(false);
    simpleStore.setFail(false);
    const {
      type1, type2, identifier, maxResults,
    } = simpleStore;
    // this.appConfig.simpleExpand(
    //   type1,
    //   type2,
    //   identifier,
    //   predicate,
    //   direction,
    //   Number(maxConnect),
    //   Number(maxResults),
    //   (data) => {
    //     messageStore.setMessage(data);
    //     simpleStore.setReady(true);
    //     simpleStore.setLoading(false);
    //   },
    //   () => {
    //     simpleStore.setFail(true);
    //     simpleStore.setLoading(false);
    //   },
    // );
  }

  const {
    type1, type2, identifier, resultsReady, resultsLoading, resultsFail, term, maxResults,
  } = simpleStore;
  // if we don't have all the info, disable the submit.
  const disableSubmit = !(type1 && type2 && identifier) || resultsLoading;
  const types = config.concepts.map((concept) => ({ text: entityNameDisplay(concept), value: concept }));
  return (
    <>
      {(predicateList.length > 0 || true) && (
        <Grid>
          <h1 className="robokopApp">
            Expansion
            <br />
            <small>
              Use the Robokop Expand API. This API allows users to post simple one-hop questions and received ranked results. Users can control returned types, predicates, and edge directionality.
            </small>
          </h1>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup controlId="node1">
                  <h3>
                    Type 1
                  </h3>
                  <DropdownList
                    filter
                    data={types}
                    textField="text"
                    valueField="value"
                    value={type1}
                    onChange={(value) => simpleStore.setType1(value.value)}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup controlId="node2">
                  <h3>
                    Type 2
                  </h3>
                  <DropdownList
                    filter
                    data={types}
                    textField="text"
                    valueField="value"
                    value={type2}
                    onChange={(value) => simpleStore.setType2(value.value)}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <h3>
                  Type 1 Identifier
                </h3>
                <div
                  style={{ padding: '5px 0px' }}
                >
                  <CurieSelectorContainer
                    concepts={config.concepts}
                    search={simpleStore.onSearch}
                    disableType
                    initialInputs={{ type: type1, term, curie: identifier }}
                    onChangeHook={(ty, te, cu) => simpleStore.handleCurieChange(ty, te, cu)}
                  />
                </div>
              </Col>
            </Row>
            <Row style={{ margin: '20px' }}>
              <Col md={5}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h4>Predicates</h4>
                  <Button
                    onClick={() => updatePredicate('')}
                    style={{ padding: '2px', margin: 'auto 0' }}
                  >
                    Clear
                  </Button>
                </div>
                <SelectList
                  data={predicateList}
                  value={predicate}
                  disabled={!predicateList.length}
                  onChange={(value) => updatePredicate(value)}
                  style={{ maxHeight: '150px' }}
                  messages={{
                    emptyList: 'Please choose types and an identifier first.',
                  }}
                />
                <h4>
                  Direction{' '}
                  <HelpButton link="expandAPI" />
                </h4>
                <SelectList
                  data={['out', 'in', 'undirected']}
                  value={direction}
                  onChange={(value) => setDirection(value)}
                />
                <div className="appQueryOptions">
                  <label htmlFor="maxConnect" style={{ display: 'block', margin: '10px 0px' }}>
                    <HelpButton link="expandAPI" />{' '}
                    Maximum Connectivity
                    <input
                      id="maxConnect"
                      style={{ marginLeft: '10px' }}
                      type="number"
                      min="0"
                      onChange={(e) => setMaxConnect(e.target.value)}
                      value={maxConnect}
                    />
                  </label>
                  <label htmlFor="maxResults" style={{ display: 'block', margin: '10px 0px' }}>
                    Maximum Results
                    <input
                      id="maxResults"
                      style={{ marginLeft: '10px' }}
                      type="number"
                      min="0"
                      onChange={(e) => simpleStore.setMaxResults(e.target.value)}
                      value={maxResults}
                    />
                  </label>
                </div>
              </Col>
            </Row>
            <Row style={{ textAlign: 'center', margin: '20px' }}>
              <Button id="submitAPI" bsSize="large" onClick={getResults} disabled={disableSubmit}>Submit</Button>
            </Row>
          </Form>
          <Row style={{ margin: '20px 0px' }}>
            {resultsLoading && (
              <Loading />
            )}
            {resultsReady && (
              <AnswersTable
                concepts={types}
                messageStore={messageStore}
                simpleExpand
                fileName={`${type1}(${identifier})_to_${type2}_expanded`}
              />
            )}
            {resultsFail && (
              <h3>
                No results came back. Please try a different query.
              </h3>
            )}
          </Row>
        </Grid>
      )}
    </>
  );
}
