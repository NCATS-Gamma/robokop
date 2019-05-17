import React from 'react';

import { DropdownList } from 'react-widgets';
import ReactTable from 'react-table';
import { Grid, Row, Col, Button, Glyphicon, Form, FormGroup, Checkbox } from 'react-bootstrap';
import FaPlus from 'react-icons/lib/fa/plus';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import CurieSelectorContainer from './components/shared/curies/CurieSelectorContainer';
import entityNameDisplay from './components/util/entityNameDisplay';
import DownloadButton from './components/shared/DownloadButton';


class SimpleEnriched extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      user: {},
      concepts: [],
      type1: '',
      type2: '',
      curies: [''],
      terms: [''],
      results: [],
      resultsLoading: false,
      resultsReady: false,
      resultsFail: false,
      includeDescendants: false,
      maxResults: 100,
      threshold: 0.5,
    };

    this.initializeState = this.initializeState.bind(this);
    this.updateType = this.updateType.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.getResults = this.getResults.bind(this);
    this.getTableColumns = this.getTableColumns.bind(this);
    this.addCuries = this.addCuries.bind(this);
    this.deleteCuries = this.deleteCuries.bind(this);
    this.toggleDescendants = this.toggleDescendants.bind(this);
    this.changeMaxResults = this.changeMaxResults.bind(this);
    this.changeThreshold = this.changeThreshold.bind(this);
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

  toggleDescendants() {
    this.setState(prevState => ({ includeDescendants: !prevState.includeDescendants }));
  }

  changeMaxResults(event) {
    // some reason why react is changing these to strings
    const maxResults = Number(event.target.value);
    this.setState({ maxResults });
  }

  changeThreshold(event) {
    // some reason why react is changing these to strings
    const threshold = Number(event.target.value);
    this.setState({ threshold });
  }

  onSearch(input, type) {
    return this.appConfig.questionNewSearch(input, type);
  }

  handleCurieChange(i, ty, te, cu) {
    if (cu || !te) {
      const { curies, terms } = this.state;
      curies[i] = cu;
      terms[i] = te;
      this.setState({ curies, terms });
    }
  }

  addCuries() {
    const { curies, terms } = this.state;
    curies.push('');
    terms.push('');
    this.setState({ curies, terms });
  }

  deleteCuries(i) {
    const { curies, terms } = this.state;
    curies.splice(i, 1);
    terms.splice(i, 1);
    this.setState({ curies, terms });
  }

  getResults(event) {
    event.preventDefault();
    this.setState({ resultsLoading: true, resultsReady: false });
    const {
      type1, type2, curies, includeDescendants, maxResults, threshold,
    } = this.state;
    const identifiers = curies.filter(id => id && id);
    const data = {
      identifiers,
      include_descendants: includeDescendants,
      max_results: maxResults,
      // someone can't spell
      threshhold: threshold,
    };
    this.appConfig.simpleEnriched(
      type1,
      type2,
      data,
      (results) => {
        this.setState({
          results, resultsReady: true, resultsLoading: false,
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
      user, concepts, type1, type2, curies, results, resultsReady, resultsLoading, resultsFail, terms,
      includeDescendants, maxResults, threshold,
    } = this.state;
    // if we don't have all the info, disable the submit.
    const disableSubmit = !(type1 && type2 && curies[0]) || resultsLoading;
    const types = concepts.map(concept => ({ text: entityNameDisplay(concept), value: concept }));
    return (
      <div>
        <Header config={config} user={user} />
        <Grid>
          <h1 style={{ textAlign: 'center' }}>Enriched Nodes</h1>
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3>
                    Node 1 Curies
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
                          concepts={concepts}
                          search={this.onSearch}
                          disableType
                          initialInputs={{ type: type1, term: terms[i], curie: curies[i] }}
                          onChangeHook={(ty, te, cu) => this.handleCurieChange(i, ty, te, cu)}
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
                            onClick={() => this.deleteCuries(i)}
                            style={{ padding: '8px' }}
                          >
                            <Glyphicon glyph="trash" />
                          </Button>
                        }
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'table-row', textAlign: 'center' }}>
                    <Button style={{ marginTop: '10px' }} onClick={this.addCuries}>
                      <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Curie'}
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
            <Row style={{ margin: '20px' }}>
              <Checkbox checked={includeDescendants} onChange={this.toggleDescendants} ><strong>Include Descendants?</strong></Checkbox>
              <label htmlFor="maxResults" style={{ display: 'block', margin: '10px 0px' }}>
                <input id="maxResults" style={{ marginRight: '10px' }} type="number" min="0" onChange={this.changeMaxResults} value={maxResults} />
                Maximum Results
              </label>
              <label htmlFor="threshold" style={{ display: 'block', margin: '10px 0px' }}>
                <input id="threshold" style={{ marginRight: '10px' }} type="number" min="0" step="0.1" onChange={this.changeThreshold} value={threshold} />
                Threshold
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
                <DownloadButton results={results} source="enriched" fileName={`${type1}_to_${type2}_enriched`} />
                <ReactTable
                  data={results}
                  columns={[{
                    Header: 'Enriched Nodes',
                    columns: this.getTableColumns(results),
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

export default SimpleEnriched;
