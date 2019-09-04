import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col, Button, Glyphicon } from 'react-bootstrap';
import { AutoSizer } from 'react-virtualized';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';

import CurieSelectorContainer from './components/shared/curies/CurieSelectorContainer';

class MultiSearch extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      user: {},
      concepts: [],
      submittedJSON: [this.defaultCurie()],
      disableType: false,
      disableTypeFilter: false,
    };

    this.onSearch = this.onSearch.bind(this);
    this.updateCurie = this.updateCurie.bind(this);
    this.addCurie = this.addCurie.bind(this);
    this.deleteCurie = this.deleteCurie.bind(this);
    this.toggleDisableType = this.toggleDisableType.bind(this);
  }

  componentDidMount() {
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
    this.appConfig.concepts((data) => {
      this.setState({
        concepts: data,
        dataReady: true,
      });
    });
  }

  onSearch(input, nodeType) {
    return this.appConfig.questionNewSearch(input, nodeType);
  }
  defaultCurie() {
    return { type: 'disease', term: '', curie: '' };
  }
  deleteCurie(i) {
    const { submittedJSON } = this.state;
    submittedJSON.splice(i, 1);
    this.setState({ submittedJSON });
  }
  addCurie() {
    const { submittedJSON } = this.state;
    submittedJSON.push(this.defaultCurie());
    this.setState({ submittedJSON });
  }
  updateCurie(i, type, term, curie) {
    const { submittedJSON } = this.state;
    submittedJSON[i] = { type, term, curie };
    this.setState({ submittedJSON });
  }
  toggleDisableType() {
    const { submittedJSON } = this.state;
    submittedJSON.forEach((curie, i) => {
      submittedJSON[i] = this.defaultCurie();
    });
    this.setState(prevState => ({ disableType: !prevState.disableType, disableTypeFilter: !prevState.disableTypeFilter }));
  }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    const { submittedJSON } = this.state;
    const curieSelectorElements = width => (
      submittedJSON.map((jsonBlob, i) => {
        const curieSelectorElement = (
          <div key={['curie', i].join('_')} style={{ display: 'flex' }}>
            <div
              style={{ flexBasis: '100%', padding: '5px 0px' }}
            >
              <CurieSelectorContainer
                concepts={this.state.concepts}
                search={(input, nodeType) => this.onSearch(input, nodeType)}
                width={width}
                disableType={this.state.disableType}
                disableTypeFilter={this.state.disableTypeFilter}
                initialInputs={jsonBlob}
                onChangeHook={(ty, te, cu) => this.updateCurie(i, ty, te, cu)}
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
          </div>
        );
        return curieSelectorElement;
      })
    );
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          <Row>
            <Col md={12}>
              <div
                style={{
                  paddingBottom: '15px',
                }}
              >
                <h2>
                  Robokop Search
                  <br />
                  <small>
                    Find nodes within the Robokop KG by their common name
                  </small>
                </h2>
              </div>
              <Button
                onClick={this.toggleDisableType}
              >
                Filter on Node Type
              </Button>
              <AutoSizer disableHeight>
                {({ width }) => (
                  <div
                    id="searchBionames"
                  >
                    {/* <div style={{ width: width / 2, padding: '10px 0px 30px 0px' }}>
                      <FormControl
                        componentClass="textarea"
                        value={this.state.rawInputJson}
                        inputRef={(ref) => {
                          this.input = ref;
                        }}
                        onChange={this.handleRawJsonChange}
                        style={{ height: '200px' }}
                      />
                      <Button
                        onClick={() => this.setState({ submittedJSON: this.state.rawInputJson })}
                      >
                        Submit
                      </Button>
                      <Button
                        onClick={() => this.setState({ rawInputJson: this.state.submittedJSON })}
                      >
                        Export
                      </Button>
                    </div> */}
                    <div style={{ display: 'table' }}>
                      {curieSelectorElements(width)}
                      <div style={{ display: 'table-row', textAlign: 'center' }}>
                        <Button
                          bsStyle="default"
                          bsSize="sm"
                          style={{ marginTop: '40px' }}
                          onClick={() => this.addCurie()}
                        >
                          <Glyphicon glyph="plus" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </AutoSizer>
            </Col>
          </Row>
        </Grid>
        <Footer config={this.props.config} />
      </div>
    );
  }
  render() {
    const ready = this.state.dataReady && this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

MultiSearch.propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.string,
  }).isRequired,
};

export default MultiSearch;
