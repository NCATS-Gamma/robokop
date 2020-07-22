import React from 'react';

import { Grid, Row, Col, Form, Button } from 'react-bootstrap';
import ReactTable from 'react-table';
import { AutoSizer } from 'react-virtualized';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import CurieSelectorContainer from './components/shared/curies/CurieSelectorContainer';
import DownloadButton from './components/shared/DownloadButton';


class Synonymize extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      user: {},
      concepts: [],
      type: 'disease', // this just needs to be something
      identifier: '',
      term: '',
      results: {},
      resultsLoading: false,
      resultsReady: false,
      resultsFail: false,
    };

    this.initializeState = this.initializeState.bind(this);
    this.updateType = this.updateType.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.getResults = this.getResults.bind(this);
  }

  componentDidMount() {
    this.initializeState();
  }

  hideHeader(state, rowInfo, column) {
    if (column.Header === 'Synonyms') {
      return { style: { display: 'none' } };
    }
    return {};
  }

  initializeState() {
    // makes the appropriate GET request from server.py,
    // uses the result to set this.state
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      // userReady: true,
    }));
    this.appConfig.concepts(data => this.setState({
      concepts: data,
    }));
  }

  updateType(typeObj) {
    this.setState(typeObj);
  }

  onSearch(input, type) {
    return this.appConfig.questionNewSearch(input, type);
  }

  handleCurieChange(ty, te, cu) {
    if (cu || !te) {
      this.setState({ identifier: cu, type: ty, term: te });
    }
  }

  getResults(event) {
    event.preventDefault();
    this.setState({ resultsLoading: true, resultsReady: false, resultsFail: false });
    const { type, identifier } = this.state;
    this.appConfig.simpleSynonymize(
      identifier,
      type,
      (data) => {
        this.setState({
          results: data, resultsReady: true, resultsLoading: false,
        });
      },
      () => {
        this.setState({
          resultsFail: true, resultsLoading: false,
        });
      },
    );
  }

  render() {
    const { config } = this.props;
    const {
      user, concepts, type, results, identifier, resultsReady, resultsLoading, resultsFail, term,
    } = this.state;
    // if we don't have all the info, disable the submit.
    const disableSubmit = !(type && identifier) || resultsLoading;
    return (
      <div>
        <Header config={config} user={user} />
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
                        style={{
                            padding: '5px 0px',
                        }}
                      >
                        <CurieSelectorContainer
                          concepts={concepts}
                          search={this.onSearch}
                          width={width}
                          initialInputs={{ type, term, curie: identifier }}
                          onChangeHook={(ty, te, cu) => this.handleCurieChange(ty, te, cu)}
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
              <Button id="submitAPI" bsSize="large" onClick={this.getResults} disabled={disableSubmit}>Submit</Button>
            </Row>
          </Form>
          <Row style={{ margin: '40px 0px 20px 0px' }}>
            {resultsLoading &&
              <Loading />
            }
            {resultsReady &&
              <div style={{ position: 'relative' }}>
                {results.synonyms.length > 0 && <DownloadButton results={results} source="synonymize" fileName={`${results.id}_synonyms`} />}
                <ReactTable
                  data={results.synonyms}
                  getTheadThProps={this.hideHeader}
                  noDataText="No synonyms found"
                  columns={[{
                    Header: 'Node Synonyms',
                    columns: [{
                      Header: 'Synonyms',
                      id: 'synonym',
                      accessor: s => s[0],
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
            }
            {resultsFail &&
              <h3>
                No results came back. Please try a different query.
              </h3>
            }
          </Row>
        </Grid>
        <Footer config={config} />
      </div>
    );
  }
}

export default Synonymize;
