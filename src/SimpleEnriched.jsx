import React from 'react';

import { DropdownList } from 'react-widgets';
import ReactTable from 'react-table';
import { Grid, Row, Col, Button, Glyphicon, Form, FormGroup } from 'react-bootstrap';
import FaPlus from 'react-icons/lib/fa/plus';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import CurieSelectorContainer from './components/shared/CurieSelectorContainer';
import entityNameDisplay from './components/util/entityNameDisplay';

const shortid = require('shortid');


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
      identifiers: [''],
      results: [],
      resultsLoading: false,
      resultsReady: false,
    };

    this.initializeState = this.initializeState.bind(this);
    this.updateType = this.updateType.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.getResults = this.getResults.bind(this);
    this.getTableColumns = this.getTableColumns.bind(this);
    this.addIdentifier = this.addIdentifier.bind(this);
    this.deleteIdentifier = this.deleteIdentifier.bind(this);
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

  handleCurieChange(i, ty, te, cu) {
    if (cu || !te) {
      const { identifiers } = this.state;
      identifiers[i] = cu;
      this.setState({ identifiers });
    }
  }

  addIdentifier() {
    const { identifiers } = this.state;
    identifiers.push('');
    this.setState({ identifiers });
  }

  deleteIdentifier(i) {
    const { identifiers } = this.state;
    identifiers.splice(i, 1);
    this.setState({ identifiers });
  }

  getResults(event) {
    event.preventDefault();
    this.setState({ resultsLoading: true, resultsReady: false });
    const { type1, type2, identifiers } = this.state;
    const iders = identifiers.filter(id => id && id);
    this.appConfig.simpleEnriched(
      type1,
      type2,
      iders,
      (data) => {
        console.log('success', data);
        this.setState({
          results: data, resultsReady: true, resultsLoading: false,
        });
      },
      () => { console.log('failure'); },
    );
  }

  getTableColumns(results) {
    if (results.length === 0) {
      return [];
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
      user, concepts, type1, type2, identifiers, results, resultsReady, resultsLoading,
    } = this.state;
    // if we don't have all the info, disable the submit.
    const disableSubmit = !(type1 && type2 && identifiers[0]);
    const types = concepts.map(concept => ({ text: entityNameDisplay(concept), value: concept }));
    return (
      <div>
        <Header config={config} user={user} />
        <Grid>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup controlId="enrichNode1">
                  <h3>
                    Node Type 1
                  </h3>
                  <DropdownList
                    filter
                    data={types}
                    textField="text"
                    valueField="value"
                    value={type1}
                    onChange={value => this.updateType({ type1: value.value })}
                  />
                  {type1 &&
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h3>
                        Node Curies
                      </h3>
                      {identifiers.map((curie, i) => (
                        <div
                          key={shortid.generate()}
                          style={{ display: 'flex' }}
                        >
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
                              initialInputs={{ type: type1, term: '', curie: identifiers[i] }}
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
                                onClick={() => this.deleteIdentifier(i)}
                                style={{ padding: '8px' }}
                              >
                                <Glyphicon glyph="trash" />
                              </Button>
                            }
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'table-row', textAlign: 'center' }}>
                        <Button style={{ marginTop: '10px' }} onClick={this.addIdentifier}>
                          <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Identifier'}
                        </Button>
                      </div>
                    </div>
                  }
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup controlId="enrichNode2">
                  <h3>
                    Node Type 2
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
            <Row style={{ textAlign: 'center' }}>
              <button id="submitEnrich" onClick={this.getResults} disabled={disableSubmit}>Submit</button>
            </Row>
          </Form>
          <Row style={{ marginBottom: '20px' }}>
            {resultsLoading &&
              <Loading />
            }
            {resultsReady &&
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
            }
          </Row>
        </Grid>
        <Footer config={config} />
      </div>
    );
  }
}

export default SimpleEnriched;
