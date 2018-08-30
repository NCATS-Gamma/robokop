import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col } from 'react-bootstrap';
import { AutoSizer } from 'react-virtualized';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';

import Bionames from './components/shared/Bionames';

class Search extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      user: {},
      concepts: [],
    };

    this.onSearch = this.onSearch.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onUnSelect = this.onUnSelect.bind(this);
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
  onSelect(selected) {
    // console.log(selected);
  }
  onUnSelect() {
    // console.log('un-selected');
  }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
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
                    <Bionames
                      concepts={this.state.concepts}
                      search={(input, nodeType) => this.onSearch(input, nodeType)}
                      onSelect={this.onSelect}
                      onUnSelect={this.onUnSelect}
                      width={width}
                    />
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

Search.propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }).isRequired,
};

export default Search;
