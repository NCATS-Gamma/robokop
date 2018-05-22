import React from 'react';

import { Grid, Row, Col, Button, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';
import CopFetchAndDisplayGroup from './components/comparison/CopFetchAndDisplayGroup';

// const shortid = require('shortid');
// const _ = require('lodash');

class ComparisonCop extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      drug: 'flupentixol',
      disease: 'schizophrenia',
      submitted: false,
      user: {},
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.handleChangeDrug = this.handleChangeDrug.bind(this);
    this.handleChangeDisease = this.handleChangeDisease.bind(this);
  }

  componentDidMount() {
    // uses the result to set this.state
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
  }

  onSubmit() {
    this.setState({ submitted: true });
  }
  handleChangeDrug(e) {
    this.setState({ drug: e.target.value });
  }
  handleChangeDisease(e) {
    this.setState({ disease: e.target.value });
  }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderInput() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <h1>
              Reasonser COP Comparison Tool
              <br />
              <small>
                Enter a disease and drug pair to explore COP answers from various reasoners.
              </small>
            </h1>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <FormGroup
              controlId="formBasicText"
            >
              <ControlLabel>Enter a Drug</ControlLabel>
              <FormControl
                type="text"
                value={this.state.drug}
                placeholder="Drug"
                onChange={this.handleChangeDrug}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <FormGroup
              controlId="formBasicText"
            >
              <ControlLabel>Enter a Disease</ControlLabel>
              <FormControl
                type="text"
                value={this.state.disease}
                placeholder="Disease"
                onChange={this.handleChangeDisease}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Button onClick={this.onSubmit}>
              Submit
            </Button>
          </Col>
        </Row>
      </Grid>
    );
  }
  renderResults() {
    return (
      <CopFetchAndDisplayGroup
        user={this.state.user}
        disease={this.state.disease}
        drug={this.state.drug}
        fetchFunGamma={this.appConfig.externalTemplateCopRequestGamma}
        fetchFunXray={this.appConfig.externalTemplateCopRequestXray}
        fetchFunIndigo={this.appConfig.externalTemplateCopRequestIndigo}
      />
    );
  }
  renderLoaded() {
    const { submitted } = this.state;
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        {!submitted && this.renderInput()}
        {submitted && this.renderResults()}
      </div>
    );
  }
  render() {
    const ready = this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default ComparisonCop;
