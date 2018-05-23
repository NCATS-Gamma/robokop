import React from 'react';

import { Grid, Row, Col, Tabs, Tab } from 'react-bootstrap';
import ComparisonFetchAndDisplay from './ComparisonFetchAndDisplay';

class CopFetchAndDisplayGroup extends React.Component {
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
                  terms={this.props.terms}
                  fetchFun={this.props.fetchFunGamma}
                />
              </Tab>
              <Tab
                eventKey={2}
                title="X-Ray"
              >
                <ComparisonFetchAndDisplay
                  user={this.props.user}
                  terms={this.props.terms}
                  fetchFun={this.props.fetchFunXray}
                />
              </Tab>
              <Tab
                eventKey={3}
                title="Indigo"
              >
                <ComparisonFetchAndDisplay
                  user={this.props.user}
                  disease={this.props.disease}
                  drug={this.props.drug}
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

CopFetchAndDisplayGroup.defaultProps = {
  title

}

export default CopFetchAndDisplayGroup;
