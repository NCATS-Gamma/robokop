import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';

import Expand from './components/simple/Expand';

class Simple extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      conceptsReady: false,
      operationsReady: false,
      userReady: false,
      user: {},
      concepts: [],
      operations: [],
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
        conceptsReady: true,
      });
    });
    this.appConfig.operations((data) => {
      this.setState({
        operations: data,
        operationsReady: true,
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
                  Robokop Simple Expand
                  <br />
                  <small>
                    An easy to use method to explore Robokop connections
                  </small>
                </h2>
              </div>
              <div>
                <Expand
                  search={this.appConfig.questionNewSearch}
                  concepts={this.state.concepts}
                  operations={this.state.operations}
                />
              </div>
            </Col>
          </Row>
        </Grid>
        <Footer config={this.props.config} />
      </div>
    );
  }
  render() {
    const ready = this.state.conceptsReady && this.state.operationsReady && this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

Simple.propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }).isRequired,
};

export default Simple;
