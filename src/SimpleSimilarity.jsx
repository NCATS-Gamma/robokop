import React from 'react';

import { DropdownList } from 'react-widgets';
import ReactTable from 'react-table';
import { Grid, Row, Col, Form, FormGroup, Button } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import CurieSelectorContainer from './components/shared/CurieSelectorContainer';
import entityNameDisplay from './components/util/entityNameDisplay';
import DownloadButton from './components/shared/DownloadButton';


class SimpleSimilarity extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      user: {},
      concepts: [],
      type1: '',
      type2: '',
      identifier: '',
      term: '',
      simType: '',
      results: [],
      resultsLoading: false,
      resultsReady: false,
      resultsFail: false,
      threshold: 0.5,
      maxResults: 250,
    };

    this.initializeState = this.initializeState.bind(this);
    this.updateType = this.updateType.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.getResults = this.getResults.bind(this);
    this.getTableColumns = this.getTableColumns.bind(this);
    this.changeThreshold = this.changeThreshold.bind(this);
    this.changeMaxResults = this.changeMaxResults.bind(this);
  }

  componentDidMount() {
    this.initializeState();
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
      this.setState({ identifier: cu, term: te });
    }
  }

  changeThreshold(event) {
    const threshold = event.target.value;
    this.setState({ threshold });
  }

  changeMaxResults(event) {
    const maxResults = event.target.value;
    this.setState({ maxResults });
  }

  getResults(event) {
    event.preventDefault();
    this.setState({ resultsLoading: true, resultsReady: false });
    const {
      type1, type2, identifier, simType, threshold, maxResults,
    } = this.state;
    this.appConfig.simpleSimilarity(
      type1,
      type2,
      identifier,
      simType,
      threshold,
      maxResults,
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

  getTableColumns(results) {
    if (results.length === 0) {
      return [{ Header: 'No data found', width: '100%', className: 'center' }];
    }
    const colHeaders = Object.keys(results[0]).map((col) => {
      const colSpecObj = {};
      colSpecObj.Header = entityNameDisplay(col);
      colSpecObj.accessor = col;
      colSpecObj.width = '33%';
      colSpecObj.className = 'center';
      return colSpecObj;
    });
    return colHeaders;
  }

  render() {
    const { config } = this.props;
    const {
      user, concepts, type1, type2, identifier, results, resultsReady, resultsLoading, simType,
      resultsFail, term, maxResults, threshold,
    } = this.state;
    // if we don't have all the info, disable the submit.
    const disableSubmit = !(type1 && type2 && identifier && simType) || resultsLoading;
    const types = concepts.map(concept => ({ text: entityNameDisplay(concept), value: concept }));
    return (
      <div>
        <Header config={config} user={user} />
        <Grid>
          <h1 style={{ textAlign: 'center' }}>Similar Nodes</h1>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup controlId="node1">
                  <h3>
                    Node 1 Type
                  </h3>
                  <DropdownList
                    filter
                    data={types}
                    textField="text"
                    valueField="value"
                    value={type1}
                    onChange={value => this.updateType({ type1: value.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup controlId="node2">
                  <h3>
                    Node 2 Type
                  </h3>
                  <DropdownList
                    filter
                    data={types}
                    textField="text"
                    valueField="value"
                    value={type2}
                    onChange={value => this.updateType({ type2: value.value })}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <h3>
                  Node 1 Curie
                </h3>
                <div
                  style={{
                      padding: '5px 0px',
                      flexBasis: '90%',
                  }}
                >
                  <CurieSelectorContainer
                    concepts={concepts}
                    search={this.onSearch}
                    disableType
                    initialInputs={{ type: type1, term, curie: identifier }}
                    onChangeHook={(ty, te, cu) => this.handleCurieChange(ty, te, cu)}
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
                    value={simType}
                    onChange={value => this.updateType({ simType: value.value })}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row style={{ margin: '20px' }}>
              <label htmlFor="maxResults" style={{ display: 'block', margin: '10px 0px' }}>
                <input id="maxResults" style={{ marginRight: '10px' }} type="number" min="0" onChange={this.changeMaxResults} value={maxResults} />
                Maximum Results
              </label>
              <label htmlFor="threshold" style={{ display: 'block', margin: '10px 0px' }}>
                <input id="threshold" style={{ marginRight: '10px', width: '172px' }} type="number" min="0" step="0.1" max="1" onChange={this.changeThreshold} value={threshold} />
                Similarity Threshold
              </label>
            </Row>
            <Row style={{ textAlign: 'right', margin: '20px' }}>
              <Button id="submitAPI" onClick={this.getResults} disabled={disableSubmit}>Submit</Button>
            </Row>
          </Form>
          <Row style={{ marginBottom: '20px' }}>
            {resultsLoading &&
              <Loading />
            }
            {resultsReady &&
              <div>
                <DownloadButton results={results} source="similarity" fileName={`${type1}_to_${type2}_with_${simType}_similarity`} />
                <ReactTable
                  data={results}
                  columns={[{
                    Header: 'Similar Nodes',
                    columns: this.getTableColumns(results),
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

export default SimpleSimilarity;
