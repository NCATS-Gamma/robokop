import React from 'react';

import { DropdownList } from 'react-widgets';
import ReactTable from 'react-table-6';
import {
  Grid, Row, Col, Button, Glyphicon, Form, FormGroup,
} from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';

import Loading from '../components/loading/Loading';
import CurieSelectorContainer from '../components/shared/curies/CurieSelectorContainer';
import entityNameDisplay from '../utils/entityNameDisplay';
import DownloadButton from '../components/shared/DownloadButton';
import config from '../config.json';

import useSimpleStore from '../stores/useSimpleStore';

// TODO: This doesn't do anything
export default function SimpleEnriched(props) {
  // const { concepts } = props;
  const simpleStore = useSimpleStore({ maxResults: 100 });

  function getResults(event) {
    event.preventDefault();
    simpleStore.setLoading(true);
    simpleStore.setReady(false);
    simpleStore.setFail(false);
    const identifiers = simpleStore.curies.filter((id) => id && id);
    const { includeDescendants, maxResults, threshold } = simpleStore;
    const data = {
      identifiers,
      include_descendants: includeDescendants,
      max_results: Number(maxResults),
      // someone can't spell
      threshhold: Number(threshold),
    };
    // this.appConfig.simpleEnriched(
    //   type1,
    //   type2,
    //   data,
    //   (results) => {
    //     this.setState({
    //       results, resultsReady: true, resultsLoading: false,
    //     });
    //   },
    //   () => {
    //     this.setState({
    //       resultsFail: true, resultsLoading: false,
    //     });
    //   },
    // );
  }

  function getTableColumns(res) {
    if (res.length === 0) {
      return [{ Header: 'No data found', width: '100%', className: 'center' }];
    }
    const colHeaders = Object.keys(res[0]).map((col) => {
      const colSpecObj = {};
      colSpecObj.Header = entityNameDisplay(col);
      colSpecObj.accessor = col;
      colSpecObj.width = '33%';
      colSpecObj.className = 'center';
      return colSpecObj;
    });
    return colHeaders;
  }

  // if we don't have all the info, disable the submit.
  const {
    type1, type2, curies, loading, setType1, setType2,
    onSearch, terms, handleCurieChange, deleteCuries,
    addCuries, toggleDescendants, setMaxResults, includeDescendants,
    maxResults, setThreshold, threshold, ready, results, fail,
  } = simpleStore;
  const disableSubmit = !(type1 && type2 && curies[0]) || loading;
  const types = config.concepts.map((concept) => ({ text: entityNameDisplay(concept), value: concept }));
  return (
    <Grid>
      <h1 className="robokopApp">
        Enrichment
        <br />
        <small>
          Use the Robokop Enrich API. This API takes a list of entities of one type, and returns a list of entities that connect to the input more frequently than would be expected by chance.
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
                onChange={(value) => setType1(value.value)}
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
                onChange={(value) => setType2(value.value)}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3>
                Type 1 Identifiers
              </h3>
              {curies.map((curie, i) => (
                <div
                  key={['curieSelector', i].join('_')}
                  style={{ display: 'flex' }}
                >
                  <div
                    style={{
                      padding: '5px 0px',
                      flexBasis: '100%',
                    }}
                  >
                    <CurieSelectorContainer
                      concepts={config.concepts}
                      search={onSearch}
                      disableType
                      initialInputs={{ type: type1, term: terms[i], curie: curies[i] }}
                      onChangeHook={(ty, te, cu) => handleCurieChange(i, ty, te, cu)}
                    />
                  </div>
                  <div
                    style={{
                      width: '30px', verticalAlign: 'top', padding: '5px 10px',
                    }}
                  >
                    {i !== 0 && (
                      <Button
                        bsStyle="default"
                        onClick={() => deleteCuries(i)}
                        style={{ padding: '8px' }}
                      >
                        <Glyphicon glyph="trash" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ display: 'table-row', textAlign: 'center' }}>
                <Button style={{ marginTop: '10px' }} onClick={addCuries}>
                  <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Identifier'}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
        <Row style={{ margin: '20px' }}>
          <Col md={5} className="appQueryOptions">
            <label htmlFor="descendants" style={{ display: 'block', margin: '10px 0px' }}>
              Include Descendants?
              <input
                id="descendants"
                style={{ marginLeft: '10px' }}
                type="checkbox"
                onChange={(e) => toggleDescendants(e.target.checked)}
                checked={includeDescendants}
              />
            </label>
            <label htmlFor="maxResults" style={{ display: 'block', margin: '10px 0px' }}>
              Maximum Results
              <input
                id="maxResults"
                style={{ marginLeft: '10px' }}
                type="number"
                min="0"
                onChange={(e) => setMaxResults(e.target.value)}
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
                onChange={(e) => setThreshold(e.target.value)}
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
        {simpleStore.loading && <Loading />}
        {ready && (
          <div style={{ position: 'relative' }}>
            {results.length > 0 && (
              <DownloadButton
                results={results}
                source="enriched"
                fileName={`${type1}_to_${type2}_enriched`}
              />
            )}
            <ReactTable
              data={results}
              columns={[{
                Header: 'Enriched Nodes',
                columns: getTableColumns(results),
              }]}
              defaultPageSize={10}
              pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
              minRows={7}
              className="-striped -highlight"
              defaultSorted={[
                {
                  id: 'p',
                  desc: true,
                },
              ]}
            />
          </div>
        )}
        {fail && (
          <h3>
            No results came back. Please try a different query.
          </h3>
        )}
      </Row>
    </Grid>
  );
}
