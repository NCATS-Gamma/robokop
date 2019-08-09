import React from 'react';
import { Grid, Row, Col, Form, Panel, Button, Glyphicon } from 'react-bootstrap';
import _ from 'lodash';
import FaDownload from 'react-icons/lib/fa/download';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import CurieSelectorContainer from './components/shared/curies/CurieSelectorContainer';
import PubmedList from './components/shared/PubmedList';


class SimplePublications extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      user: {},
      concepts: [],
      entities: [
        { type: 'disease', term: '', curie: '' },
      ],
      pubs: [],
      loading: false,
      loaded: false,
      fail: false,
      downloadingPubs: false,
    };

    this.initializeState = this.initializeState.bind(this);
    this.addCurie = this.addCurie.bind(this);
    this.deleteCurie = this.deleteCurie.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.downloadPublicationsInfo = this.downloadPublicationsInfo.bind(this);
    this.getResults = this.getResults.bind(this);
  }

  componentDidMount() {
    this.initializeState();
  }

  initializeState() {
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
    }));
    this.appConfig.concepts(data => this.setState({
      concepts: data,
    }));
  }

  addCurie() {
    const { entities } = this.state;
    entities.push({ type: 'disease', term: '', curie: '' });
    this.setState({ entities });
  }

  deleteCurie(i) {
    const { entities } = this.state;
    entities.splice(i, 1);
    this.setState({ entities });
  }

  onSearch(input, type) {
    return this.appConfig.questionNewSearch(input, type);
  }

  handleCurieChange(type, term, curie, i) {
    const { entities } = this.state;
    entities[i] = { type, term, curie };
    this.setState({ entities });
  }

  downloadPublicationsInfo(publications) {
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

    Promise.all(publications.map(pmid => new Promise(resolve => resolve(getPubmedInformation(pmid))))).then((data) => {
      // Transform the data into a json blob and give it a url
      // const json = JSON.stringify(data);
      // const blob = new Blob([json], { type: 'application/json' });
      // const url = URL.createObjectURL(blob);

      const fields = ['url', 'title', 'journal', 'pubdate'];
      const replacer = (key, value) => value || '';

      const csv = data.map(row => fields.map(f => JSON.stringify(row[f], replacer)).join(','));
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
    }).then(() => this.setState({ downloadingPubs: false }));
  }

  getResults(event) {
    event.preventDefault();
    const { entities } = this.state;
    this.setState({ loading: true, loaded: false, fail: false });
    const requests = entities.map(node => (
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
        this.setState({ pubs, loading: false, loaded: true });
      })
      .catch((err) => {
        console.log('Something went wrong', err);
        this.setState({ loading: false, fail: true });
      });
  }

  render() {
    const { config } = this.props;
    const {
      user, concepts, entities, pubs, loading, loaded, fail,
    } = this.state;
    const disabled = entities.some(entity => !entity.curie);
    const downloadCallback = () => this.setState({ downloadingPubs: true }, () => this.downloadPublicationsInfo(pubs));
    const showDownload = pubs.length >= 1;

    const cursor = this.state.downloadingPubs ? 'progress' : 'pointer';
    const activeCallback = this.state.downloadingPubs ? () => { } : downloadCallback;
    const downloadTitle = this.state.downloadingPubs ? 'Downloading Please Wait' : 'Download Publications';
    const downloadColor = this.state.downloadingPubs ? '#333' : '#000';
    return (
      <div>
        <Header config={config} user={user} />
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
                    <div
                      style={{ flexBasis: '100%', padding: '5px 0px' }}
                    >
                      <CurieSelectorContainer
                        concepts={concepts}
                        search={this.onSearch}
                        initialInputs={{ type: node.type, term: node.term, curie: node.curie }}
                        onChangeHook={(ty, te, cu) => this.handleCurieChange(ty, te, cu, i)}
                        disableType
                        disableTypeFilter
                      />
                    </div>
                    <div
                      style={{
                        width: '30px', verticalAlign: 'top', padding: '5px 10px',
                      }}
                    >
                      {(i !== 0) &&
                        <Button
                          bsStyle="default"
                          onClick={() => this.deleteCurie(i)}
                          style={{ padding: '8px' }}
                        >
                          <Glyphicon glyph="trash" />
                        </Button>
                      }
                    </div>
                  </Row>
                ))}
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <Button
                    bsStyle="default"
                    bsSize="sm"
                    onClick={this.addCurie}
                  >
                    <Glyphicon glyph="plus" />
                  </Button>
                </div>
              </Col>
            </Row>
            <Row style={{ textAlign: 'center', margin: '40px 0px' }}>
              <Button id="submitAPI" bsSize="large" onClick={this.getResults} disabled={disabled}>Submit</Button>
            </Row>
          </Form>
          <Row style={{ margin: '20px 0px' }}>
            {loading &&
              <Loading />
            }
            {loaded &&
              <Panel>
                <Panel.Heading>
                  <Panel.Title>
                    {pubs.length} Publications
                    <div className="pull-right">
                      <div style={{ position: 'relative' }}>
                        {showDownload &&
                          <div style={{ position: 'absolute', top: -3, right: -8 }}>
                            <span style={{ fontSize: '22px', color: downloadColor }} title={downloadTitle}>
                              <FaDownload onClick={activeCallback} style={{ cursor }} />
                            </span>
                          </div>
                        }
                      </div>
                    </div>
                  </Panel.Title>
                </Panel.Heading>
                <Panel.Body style={{ padding: 0 }}>
                  <PubmedList publications={pubs} />
                </Panel.Body>
              </Panel>
            }
            {fail &&
              <h4 style={{ textAlign: 'center' }}>There was an error with your request. Please try a different query.</h4>
            }
          </Row>
        </Grid>
        <Footer config={config} />
      </div>
    );
  }
}

export default SimplePublications;
