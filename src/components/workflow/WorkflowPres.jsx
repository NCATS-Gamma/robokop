import React from 'react';

import { Grid, Row, Col, Button, PanelGroup, Panel } from 'react-bootstrap';
import FaPlus from 'react-icons/fa/plus';
import WorkflowStep from './WorkflowStep';

const shortid = require('shortid');
const _ = require('lodash');

class WorkflowPres extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      workflow: [{}],
      activeKey: 0,
    };

    this.defaultWorkflow = {};

    this.steps = this.generateStep(this.defaultWorkflow, 0);

    this.generateStep = this.generateStep.bind(this);
    this.generateSteps = this.generateSteps.bind(this);
    this.addStep = this.addStep.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  componentDidMount() {
    this.syncPropsAndState(this.props);
  }

  syncPropsAndState(newProps) {
    this.setState({
      workflow: newProps.initWorkflow,
    });
    this.steps = this.generateSteps();
  }

  handleSelect(activeKey) {
    this.setState({ activeKey });
  }

  addStep() {
    const newWorkflow = _.cloneDeep(this.state.workflow);
    const newWorkflowItem = this.defaultWorkflow;
    newWorkflow.push(newWorkflowItem);
    this.steps.push(this.generateStep(newWorkflowItem, newWorkflow.length - 1));
    this.setState({ workflow: newWorkflow, activeKey: newWorkflow.length - 1 });
  }

  generateSteps() {
    return this.state.workflow.map((w, i) => this.generateStep(w, i));
  }

  generateStep(w, i) {
    return (
      <Panel eventKey={i} key={shortid.generate()}>
        <Panel.Heading>
          <Panel.Title toggle componentClass="h2">
            {`Step ${i + 1}`}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body collapsible style={{ paddingTop: 0, paddingBottom: 0 }}>
          <WorkflowStep
            config={this.props.config}
            index={i}
            data={w}
          />
        </Panel.Body>
      </Panel>
    );
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <h1>
              Robokop Workflow
              <small>
                <br />
                Use Robokop and other biomedical reasoners to answer complex questions.
              </small>
            </h1>
            <PanelGroup
              accordion
              id="workflow-accordion"
              activeKey={this.state.activeKey}
              onSelect={this.handleSelect}
            >
              {this.steps}
            </PanelGroup>
          </Col>
        </Row>
        <Row>
          <Col md={2} mdOffset={5}>
            <Button bsStyle="default" bsSize="sm" onClick={this.addStep}>
              <FaPlus />
            </Button>
            <br />
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default WorkflowPres;
