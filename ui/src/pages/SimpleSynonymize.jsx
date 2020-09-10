import React from 'react';
import {
  Grid, Row, Col, Form, Button,
} from 'react-bootstrap';
import ReactTable from 'react-table-6';
import { AutoSizer } from 'react-virtualized';

import Loading from '../components/loading/Loading';
import CurieSelectorContainer from '../components/shared/curies/CurieSelectorContainer';
import DownloadButton from '../components/shared/DownloadButton';

import useSimpleStore from '../stores/useSimpleStore';
import config from '../config.json';

export default function SimpleSynonymize() {
  const simpleStore = useSimpleStore({ type1: 'disease' });

  function hideHeader(state, rowInfo, column) {
    if (column.Header === 'Synonyms') {
      return { style: { display: 'none' } };
    }
    return {};
  }

  function getResults(event) {
    event.preventDefault();
    simpleStore.setLoading(true);
    simpleStore.setReady(false);
    simpleStore.setFail(false);
    const { type1, identifier } = simpleStore;
    // this.appConfig.simpleSynonymize(
    //   identifier,
    //   type1,
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
    type, results, identifier, ready, loading, fail, term,
  } = simpleStore;
  // if we don't have all the info, disable the submit.
  const disableSubmit = !(type && identifier) || loading;
  return (
    <Grid>
      <h1 className="robokopApp">
        Identifier Lookup
        <br />
        <small>
          Use the Robokop Synonymize API. This API takes an identifier and returns all of the other identifiers by which that entity is known, as well as the identifier by which that entity is known in Robokop.
        </small>
      </h1>
      <Form>
        <Row>
          <Col md={12}>
            <div>
              <h3>
                Identifier
              </h3>
              <AutoSizer disableHeight>
                {({ width }) => (
                  <div
                    style={{ padding: '5px 0px' }}
                  >
                    <CurieSelectorContainer
                      concepts={config.concepts}
                      search={simpleStore.onSearch}
                      width={width}
                      initialInputs={{ type, term, curie: identifier }}
                      onChangeHook={(ty, te, cu) => simpleStore.handleCurieChange(ty, te, cu)}
                      disableType
                      disableTypeFilter
                    />
                  </div>
                )}
              </AutoSizer>
            </div>
          </Col>
        </Row>
        <Row style={{ textAlign: 'center', margin: '20px' }}>
          <Button id="submitAPI" bsSize="large" onClick={getResults} disabled={disableSubmit}>Submit</Button>
        </Row>
      </Form>
      <Row style={{ margin: '40px 0px 20px 0px' }}>
        {loading && (
          <Loading />
        )}
        {ready && (
          <div style={{ position: 'relative' }}>
            {results.synonyms.length > 0 && <DownloadButton results={results} source="synonymize" fileName={`${results.id}_synonyms`} />}
            <ReactTable
              data={results.synonyms}
              getTheadThProps={hideHeader}
              noDataText="No synonyms found"
              columns={[{
                Header: 'Node Synonyms',
                columns: [{
                  Header: 'Synonyms',
                  id: 'synonym',
                  accessor: (s) => s[0],
                  className: 'center',
                  Cell: (row) => {
                    if (row.value === results.id) {
                      return <span style={{ fontWeight: 'bold' }}>{row.value}</span>;
                    }
                    return <span>{row.value}</span>;
                  },
                }],
              }]}
              minRows={7}
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
