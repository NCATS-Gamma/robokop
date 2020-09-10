import React, { useState } from 'react';
import {
  Grid, Row, Col, Form, Panel, Button, Glyphicon,
} from 'react-bootstrap';
import _ from 'lodash';
import { FaDownload } from 'react-icons/fa';
import { AutoSizer } from 'react-virtualized';

import Loading from '../components/loading/Loading';
import CurieSelectorContainer from '../components/shared/curies/CurieSelectorContainer';
import PubmedList from '../components/shared/pubmedList/PubmedList';

import useSimpleStore from '../stores/useSimpleStore';
import config from '../config.json';

export default function SimplePublications() {
  const [entities, setEntities] = useState([
    { type: 'disease', term: '', curie: '' },
  ]);
  const [publications, setPublications] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const simpleStore = useSimpleStore({});

  function addEntity() {
    const newEntity = { type: 'disease', term: '', curie: '' };
    setEntities((oldEntities) => [...oldEntities, newEntity]);
  }

  function removeEntity(i) {
    entities.splice(i, 1);
    setEntities([...entities]);
  }

  function downloadPublicationsInfo(pubs) {
    const defaultInfo = {
      id: '',
      title: 'Unable to fetch publication information',
      authors: [],
      journal: '',
      source: '',
      pubdate: '',
      url: '',
      doid: '',
    };
    const getInfo = (pub) => {
      const paperInfo = {
        id: pub.uid,
        title: pub.title,
        authors: pub.authors,
        journal: pub.fulljournalname,
        source: pub.source,
        pubdate: pub.pubdate,
        url: `https://www.ncbi.nlm.nih.gov/pubmed/${pub.uid}/`,
        doid: pub.elocationid,
      };
      return { ...defaultInfo, ...paperInfo };
    };

    const getPubmedInformation = (pmid) => {
      let pmidStr = pmid.toString();
      if ((typeof pmidStr === 'string' || pmidStr instanceof String) && (pmidStr.indexOf(':') !== -1)) {
        // pmidStr has a colon, and therefore probably a curie, remove it.
        pmidStr = pmidStr.substr(pmidStr.indexOf(':') + 1);
      }

      return new Promise((resolve, reject) => {
        this.appConfig.getPubmedPublications(
          pmidStr,
          (pub) => {
            resolve(getInfo(pub));
          },
          (err) => {
            console.log(err);
            reject(defaultInfo);
          },
        );
      });
    };

    Promise.all(pubs.map((pmid) => new Promise((resolve) => resolve(getPubmedInformation(pmid))))).then((data) => {
      // Transform the data into a json blob and give it a url
      // const json = JSON.stringify(data);
      // const blob = new Blob([json], { type: 'application/json' });
      // const url = URL.createObjectURL(blob);

      const fields = ['url', 'title', 'journal', 'pubdate'];
      const replacer = (key, value) => value || '';

      const csv = data.map((row) => fields.map((f) => JSON.stringify(row[f], replacer)).join(','));
      csv.unshift(fields.join(','));
      const csvText = csv.join('\n');

      const blob = new Blob([csvText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Create a link with that URL and click it.
      const a = document.createElement('a');
      a.download = 'publications.csv';
      a.href = url;
      a.click();
      a.remove();
    }).then(() => simpleStore.setLoading(false));
  }

  function getResults(event) {
    event.preventDefault();
    simpleStore.setLoading(true);
    simpleStore.setReady(false);
    simpleStore.setFail(false);
    const requests = entities.map((node) => (
      new Promise((resolve, reject) => {
        this.appConfig.getPublication(
          node.curie,
          (res) => {
            resolve(res);
          },
          () => {
            reject();
          },
        );
      })
    ));
    Promise.all(requests)
      .then((res) => {
        const pubs = _.intersection(...res);
        setPublications(pubs);
        simpleStore.setLoading(false);
        simpleStore.setReady(true);
      })
      .catch((err) => {
        console.log('Something went wrong', err);
        simpleStore.setLoading(false);
        simpleStore.setFail(true);
      });
  }

  const disabled = entities.some((entity) => !entity.curie);
  // TODO: this is probably wrong
  const downloadCallback = () => {
    setDownloading(true);
    return downloadPublicationsInfo(publications);
  };
  const showDownload = publications.length >= 1;

  const cursor = downloading ? 'progress' : 'pointer';
  const activeCallback = downloading ? () => {} : downloadCallback;
  const downloadTitle = downloading ? 'Downloading Please Wait' : 'Download Publications';
  const downloadColor = downloading ? '#333' : '#000';
  return (
    <Grid>
      <h1 className="robokopApp">
        Omnicorp Shared Publications
        <br />
        <small>
          Use the Robokop Omnicorp API. This API takes defined entities and returns the publications that they share.
        </small>
      </h1>
      <Form>
        <Row>
          <Col md={12}>
            <h3>
              Identifiers
            </h3>
            {entities.map((node, i) => (
              <Row key={`curie-${i}`} style={{ display: 'flex' }}> {/* eslint-disable-line */}
                <AutoSizer disableHeight>
                  {({ width }) => (
                    <div
                      style={{ flexBasis: '100%', padding: '5px 0px' }}
                    >
                      <CurieSelectorContainer
                        concepts={config.concepts}
                        search={simpleStore.onSearch}
                        width={width}
                        initialInputs={{ type: node.type, term: node.term, curie: node.curie }}
                        onChangeHook={(ty, te, cu) => simpleStore.handleCurieChange(ty, te, cu, i)}
                        disableType
                        disableTypeFilter
                      />
                    </div>
                  )}
                </AutoSizer>
                <div
                  style={{
                    width: '30px', verticalAlign: 'top', padding: '5px 10px',
                  }}
                >
                  {(i !== 0) && (
                    <Button
                      bsStyle="default"
                      onClick={() => removeEntity(i)}
                      style={{ padding: '8px' }}
                    >
                      <Glyphicon glyph="trash" />
                    </Button>
                  )}
                </div>
              </Row>
            ))}
            <div style={{ width: '100%', textAlign: 'center' }}>
              <Button
                bsStyle="default"
                bsSize="sm"
                onClick={addEntity}
              >
                <Glyphicon glyph="plus" />
              </Button>
            </div>
          </Col>
        </Row>
        <Row style={{ textAlign: 'center', margin: '40px 0px' }}>
          <Button id="submitAPI" bsSize="large" onClick={getResults} disabled={disabled}>Submit</Button>
        </Row>
      </Form>
      <Row style={{ margin: '20px 0px' }}>
        {simpleStore.loading && (
          <Loading />
        )}
        {simpleStore.ready && (
          <Panel>
            <Panel.Heading>
              <Panel.Title>
                {publications.length} Publications
                <div className="pull-right">
                  <div style={{ position: 'relative' }}>
                    {showDownload && (
                      <div style={{ position: 'absolute', top: -3, right: -8 }}>
                        <span style={{ fontSize: '22px', color: downloadColor }} title={downloadTitle}>
                          <FaDownload onClick={activeCallback} style={{ cursor }} />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Panel.Title>
            </Panel.Heading>
            <Panel.Body style={{ padding: 0 }}>
              <PubmedList publications={publications} />
            </Panel.Body>
          </Panel>
        )}
        {simpleStore.fail && (
          <h4 style={{ textAlign: 'center' }}>There was an error with your request. Please try a different query.</h4>
        )}
      </Row>
    </Grid>
  );
}
