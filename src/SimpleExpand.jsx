import React from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';

import { DropdownList, SelectList } from 'react-widgets';
import { Grid, Row, Col, Form, FormGroup, Button } from 'react-bootstrap';

import AppConfig from './AppConfig';
import AnswersetStore from './stores/messageAnswersetStore';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import HelpButton from './components/shared/HelpButton';
import MessageAnswersetTable from './components/answerset/MessageAnswersetTable';
import CurieSelectorContainer from './components/shared/curies/CurieSelectorContainer';
import entityNameDisplay from './components/util/entityNameDisplay';


@inject(({ store }) => ({ store }))
@observer
class SimpleExpand extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      type1: '',
      type2: '',
      identifier: '',
      term: '',
      resultsLoading: false,
      resultsReady: false,
      resultsFail: false,
      maxConnect: 0,
      maxResults: 250,
      predicate: [],
      direction: 'out',
    };

    this.updateType = this.updateType.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.getResults = this.getResults.bind(this);
    this.changeMaxResults = this.changeMaxResults.bind(this);
    this.changeMaxConnect = this.changeMaxConnect.bind(this);
    this.getPredicateList = this.getPredicateList.bind(this);

    this.answersetStore = '';
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

  changeMaxResults(event) {
    // some reason why react is changing these to strings
    const maxResults = Number(event.target.value);
    this.setState({ maxResults });
  }

  changeMaxConnect(event) {
    // some reason why react is changing these to strings
    const maxConnect = Number(event.target.value);
    this.setState({ maxConnect });
  }

  getPredicateList() {
    const { type1, type2, identifier } = this.state;
    let predicateList = [];
    if (type1 && type2 && identifier) {
      predicateList = [...new Set(this.props.store.predicateList[type1][type2])];
    }
    return predicateList;
  }

  getResults(event) {
    event.preventDefault();
    this.setState({ resultsLoading: true, resultsReady: false, resultsFail: false });
    const {
      type1, type2, identifier, predicate, direction, maxConnect, maxResults,
    } = this.state;
    this.appConfig.simpleExpand(
      type1,
      type2,
      identifier,
      predicate,
      direction,
      maxConnect,
      maxResults,
      (data) => {
        this.answersetStore = new AnswersetStore(data);
        this.setState({
          resultsReady: true, resultsLoading: false,
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
    const { config, store } = this.props;
    const ready = store.conceptsReady && store.userReady && store.predicatesReady;
    const {
      type1, type2, identifier, resultsReady, resultsLoading, resultsFail, term, maxConnect, maxResults,
      predicate, direction,
    } = this.state;
    const predicateList = this.getPredicateList();
    // if we don't have all the info, disable the submit.
    const disableSubmit = !(type1 && type2 && identifier) || resultsLoading;
    const types = store.concepts.map(concept => ({ text: entityNameDisplay(concept), value: concept }));
    return (
      <div>
        {ready &&
          <div>
            <Header config={config} user={store.user} />
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
                        onChange={value => this.updateType({ type1: value.value })}
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
                        onChange={value => this.updateType({ type2: value.value })}
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
                      }}
                    >
                      <CurieSelectorContainer
                        concepts={toJS(store.concepts)}
                        search={this.onSearch}
                        disableType
                        initialInputs={{ type: type1, term, curie: identifier }}
                        onChangeHook={(ty, te, cu) => this.handleCurieChange(ty, te, cu)}
                      />
                    </div>
                  </Col>
                </Row>
                <Row style={{ margin: '20px' }}>
                  <Col md={5}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h4>Predicates</h4>
                      <Button
                        onClick={() => this.setState({ predicate: '' })}
                        style={{ padding: '2px', margin: 'auto 0' }}
                      >
                        Clear
                      </Button>
                    </div>
                    <SelectList
                      data={predicateList}
                      value={predicate}
                      disabled={!predicateList.length}
                      onChange={value => this.setState({ predicate: value })}
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
                      onChange={value => this.setState({ direction: value })}
                    />
                    <div className="appQueryOptions">
                      <label htmlFor="maxConnect" style={{ display: 'block', margin: '10px 0px' }}>
                        <HelpButton link="expandAPI" />{' '}
                        Maximum Connectivity
                        <input id="maxConnect" style={{ marginLeft: '10px' }} type="number" min="0" onChange={this.changeMaxConnect} value={maxConnect} />
                      </label>
                      <label htmlFor="maxResults" style={{ display: 'block', margin: '10px 0px' }}>
                        Maximum Results
                        <input id="maxResults" style={{ marginLeft: '10px' }} type="number" min="0" onChange={this.changeMaxResults} value={maxResults} />
                      </label>
                    </div>
                  </Col>
                </Row>
                <Row style={{ textAlign: 'center', margin: '20px' }}>
                  <Button id="submitAPI" bsSize="large" onClick={this.getResults} disabled={disableSubmit}>Submit</Button>
                </Row>
              </Form>
              <Row style={{ margin: '20px 0px' }}>
                {resultsLoading &&
                  <Loading />
                }
                {resultsReady &&
                  <MessageAnswersetTable
                    concepts={types}
                    store={this.answersetStore}
                    simpleExpand
                    fileName={`${type1}(${identifier})_to_${type2}_expanded`}
                  />
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
        }
      </div>
    );
  }
}

export default SimpleExpand;
