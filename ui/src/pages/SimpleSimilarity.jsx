import React from 'react';

import { DropdownList } from 'react-widgets';
import ReactTable from 'react-table-6';
import {
  Grid, Row, Col, Form, FormGroup, Button,
} from 'react-bootstrap';

import Loading from '../components/loading/Loading';
import CurieSelectorContainer from '../components/shared/curies/CurieSelectorContainer';
import entityNameDisplay from '../utils/entityNameDisplay';
import DownloadButton from '../components/shared/DownloadButton';
import useSimpleStore from '../stores/useSimpleStore';

import config from '../config.json';

export default function SimpleSimilarity(props) {
  // const { concepts } = props;
  const simpleStore = useSimpleStore({ maxResults: 100 });

  function getResults(event) {
    event.preventDefault();
    simpleStore.setLoading(true);
    simpleStore.setReady(false);
    const {
      type1, type2, identifier, similarType, threshold, maxResults,
    } = simpleStore;
    // this.appConfig.simpleSimilarity(
    //   type1,
    //   type2,
    //   identifier,
    //   simType,
    //   Number(threshold),
    //   Number(maxResults),
    //   (data) => {
    //     simpleStore.setResults(data);
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
    type1, type2, identifier, results, resultsReady, resultsLoading, similarType,
    resultsFail, term, maxResults, threshold,
  } = simpleStore;
  // if we don't have all the info, disable the submit.
  const disableSubmit = !(type1 && type2 && identifier && similarType) || resultsLoading;
  const types = config.concepts.map((concept) => ({ text: entityNameDisplay(concept), value: concept }));
  return (
    <Grid>
      <h1 className="robokopApp">
        Similarity
        <br />
        <small>
          Use the Robokop Similarity API. This API performs a Jaccard similarity search in the Robokop knowledge graph, where similarity is calculated over shared nodes. Returns the most similar nodes, along with their similarity scores.
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
              style={{
                padding: '5px 0px',
                flexBasis: '90%',
              }}
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
        <Row>
          <Col md={6}>
            <FormGroup controlId="similarityType">
              <h3>
                Similarity Type
              </h3>
              <DropdownList
                filter
                data={types}
                textField="text"
                valueField="value"
                value={similarType}
                onChange={(value) => simpleStore.setSimilarType(value.value)}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row style={{ margin: '20px' }}>
          <Col md={5} className="appQueryOptions">
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
            <label htmlFor="threshold" style={{ display: 'block', margin: '10px 0px' }}>
              Threshold
              <input
                id="threshold"
                style={{ marginLeft: '10px' }}
                type="number"
                min="0"
                step="0.1"
                max="1"
                onChange={(e) => simpleStore.setThreshold(e.target.value)}
                value={threshold}
              />
            </label>
          </Col>
        </Row>
        <Row style={{ textAlign: 'center', margin: '20px' }}>
          <Button id="submitAPI" bsSize="large" onClick={getResults} disabled={disableSubmit}>Submit</Button>
        </Row>
      </Form>
      <Row style={{ margin: '40px 0px 20px 0px' }}>
        {resultsLoading && (
          <Loading />
        )}
        {resultsReady && (
          <div style={{ position: 'relative' }}>
            {results.length > 0 && (
              <DownloadButton
                results={results}
                source="similarity"
                fileName={`${type1}_to_${type2}_with_${similarType}_similarity`}
              />
            )}
            <ReactTable
              data={results}
              columns={[{
                Header: 'Similar Nodes',
                columns: simpleStore.getTableColumns(results),
              }]}
              defaultPageSize={10}
              pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
              minRows={7}
              className="-striped -highlight"
              defaultSorted={[
                {
                  id: 'similarity',
                  desc: true,
                },
              ]}
            />
          </div>
        )}
        {resultsFail && (
          <h3>
            No results came back. Please try a different query.
          </h3>
        )}
      </Row>
    </Grid>
  );
}
