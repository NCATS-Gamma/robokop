import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col, FormControl, Button } from 'react-bootstrap';
import { AutoSizer } from 'react-virtualized';


import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';

import CurieSelectorContainer from './components/shared/CurieSelectorContainer';

const _ = require('lodash');

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
      rawInputJson: '',
      submittedJSON: '',
    };

    this.onSearch = this.onSearch.bind(this);
    this.handleRawJsonChange = this.handleRawJsonChange.bind(this);
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
  handleRawJsonChange(event) {
    this.setState({ rawInputJson: event.target.value });
  }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    const isEmptyJsonInput = this.state.submittedJSON === '';
    let curieSelectorElements;
    if (isEmptyJsonInput) {
      curieSelectorElements = width => (
        <CurieSelectorContainer
          concepts={this.state.concepts}
          search={(input, nodeType) => this.onSearch(input, nodeType)}
          width={width}
          displayType
        />
      );
    } else {
      let submittedJSON = JSON.parse(this.state.submittedJSON);
      if (_.isPlainObject(submittedJSON)) {
        submittedJSON = [submittedJSON];
      }
      if (Array.isArray(submittedJSON)) {
        console.log('Array is:', submittedJSON);
        curieSelectorElements = width => (
          submittedJSON.map(jsonBlob => (
            <CurieSelectorContainer
              concepts={this.state.concepts}
              search={(input, nodeType) => this.onSearch(input, nodeType)}
              width={width}
              displayType
              initialInputs={jsonBlob}
              key={jsonBlob.curie}
            />
          ))
        );
      }
    }
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
                  Bionames Search
                  <br />
                  <small>
                    An easy to use interface for the <a href="https://bionames.renci.org/apidocs/">Bionames service</a>
                  </small>
                </h2>
              </div>
              <AutoSizer disableHeight>
                {({ width }) => (
                  <div
                    id="searchBionames"
                  >
                    <div style={{ width: width / 2, padding: '10px 0px 30px 0px' }}>
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
                    </div>

                    {curieSelectorElements(width)}
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
    port: PropTypes.number,
  }).isRequired,
};

export default MultiSearch;
