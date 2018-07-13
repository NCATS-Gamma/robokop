import React from 'react';

import { Grid, Tab, Row, Col, Nav, NavItem } from 'react-bootstrap';

import WorkflowStepQuestion from './WorkflowStepQuestion';
import WorkflowStepAnswers from './WorkflowStepAnswers';
import WorkflowStepExport from './WorkflowStepExport';

const shortid = require('shortid');

class WorkflowStep extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: 'question',
      enableQuestion: true,
      enableAnswers: false,
      enableExport: false,
      question: null,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.callbackMarkAnswers = this.callbackMarkAnswers.bind(this);
    this.callbackMarkExport = this.callbackMarkExport.bind(this);
  }

  handleTabSelect(activeTab) {
    this.setState({ activeTab });
  }
  callbackMarkAnswers(value = true) {
    this.setState({ enableAnswers: value });
  }
  callbackMarkExport(value = true) {
    this.setState({ enableExport: value });
  }
  toAnswers(question) {
    this.setState({ question }, this.handleTabSelect('export'));
  }

  render() {
    return (
      <Tab.Container
        id="workflow-left-tabs"
        onSelect={this.handleTabSelect}
        activeKey={this.state.activeTab}
      >
        <Row className="clearfix">
          <Col sm={2} style={{ paddingRight: 0, paddingLeft: 0 }}>
            <Nav bsStyle="pills" stacked>
              <NavItem eventKey="question" disabled={!this.state.enableQuestion}>Question</NavItem>
              <NavItem eventKey="answers" disabled={!this.state.enableAnswers}>Answers</NavItem>
              <NavItem eventKey="export" disabled={!this.state.enableExport}>Export</NavItem>
            </Nav>
          </Col>
          <Col sm={10} style={{ borderLeft: 'solid 1px #b8c6db', minHeight: '500px', paddingLeft: 0, paddingRight: 0 }}>
            <Tab.Content animation>
              <Tab.Pane eventKey="question">
                <WorkflowStepQuestion
                  height={500}
                  config={this.props.config}
                  concepts={this.props.concepts}
                  callbackEnableNextTab={value => this.callbackMarkAnswers(value)}
                  callbackToNextTab={(newQuestion) => this.toAnswers(newQuestion)}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="answers">
                <WorkflowStepAnswers
                  config={this.props.config}
                  concepts={this.props.concepts}
                  question={this.state.question}
                  callbackEnableNextTab={value => this.callbackMarkExport(value)}
                  callbackToNextTab={() => this.handleTabSelect('export')}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="export">
                <WorkflowStepExport
                  config={this.props.config}
                  concepts={this.props.concepts}
                  callbackDone={() => console.log('New Answers have been exported')}
                />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    );
  }
}

WorkflowStep.defaultProps = {
  data: {},
  index: 0,
};

export default WorkflowStep;
