import React from 'react';

import { Grid, Row, Col, Button, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';
import ComparisonFetchAndDisplayGroup from './components/comparison/ComparisonFetchAndDisplayGroup';

// const shortid = require('shortid');
// const _ = require('lodash');

class Comparison extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      terms: { chemical_substance: 'CHEMBL:CHEMBL521' },
      queryId: 'Q3',
      submitted: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.handleChangeTerms = this.handleChangeTerms.bind(this);
    this.handleChangeDrug = this.handleChangeDrug.bind(this);
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
    this.handleChangeTerms({ terms: { chemical_substance: e.target.value } });
  }
  handleChangeTerms(newTerms) {
    this.setState(newTerms);
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
                Enter a drug to explore associated genes.
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
                value={this.state.terms.chemical_substance}
                placeholder="Drug"
                onChange={this.handleChangeDrug}
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
      <ComparisonFetchAndDisplayGroup
        user={this.state.user}
        terms={this.state.terms}
        queryId={this.state.queryId}
        fetchFunGamma={this.appConfig.externalTemplateRequestGamma}
        fetchFunXray={this.appConfig.externalTemplateRequestXray}
        fetchFunIndigo={this.appConfig.externalTemplateRequestIndigo}
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

export default Comparison;
