import React from 'react';

import { Grid, Row, Col, Tabs, Tab } from 'react-bootstrap';
import ComparisonFetchAndDisplay from './ComparisonFetchAndDisplay';

class ComparisonFetchAndDisplayGroup extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.state = {
      tabKey: 1,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
  }

  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <h1>
              {this.props.title}
              <br />
              <small>
                {this.props.subTitle}
              </small>
            </h1>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Tabs
              activeKey={this.state.tabKey}
              onSelect={this.handleTabSelect}
              animation
              id="answerset_tabs"
              mountOnEnter
            >
              <Tab
                eventKey={1}
                title="Gamma"
              >
                <ComparisonFetchAndDisplay
                  user={this.props.user}
                  concepts={this.props.concepts}
                  name="Gamma"
                  terms={this.props.terms}
                  queryId={this.props.queryId}
                  fetchFun={this.props.fetchFunGamma}
                />
              </Tab>
              <Tab
                eventKey={2}
                title="X-Ray"
              >
                <ComparisonFetchAndDisplay
                  user={this.props.user}
                  concepts={this.props.concepts}
                  name="X-Ray"
                  terms={this.props.terms}
                  queryId={this.props.queryId}
                  fetchFun={this.props.fetchFunXray}
                />
              </Tab>
              <Tab
                eventKey={3}
                title="Indigo"
              >
                <ComparisonFetchAndDisplay
                  user={this.props.user}
                  concepts={this.props.concepts}
                  name="Indigo"
                  terms={this.props.terms}
                  queryId={this.props.queryId}
                  fetchFun={this.props.fetchFunIndigo}
                />
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Grid>
    );
  }
}

ComparisonFetchAndDisplayGroup.defaultProps = {
  title: 'Reasoner Comparison Tool',
  subTitle: 'A tool to visualize the results of different reasoners',
  terms: {},
  queryId: '',
};

export default ComparisonFetchAndDisplayGroup;
