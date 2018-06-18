import React from 'react';

import { Row, Col, ButtonToolbar, Button } from 'react-bootstrap';
import Select from 'react-select';
import MachineQuestionViewAndEdit from '../shared/MachineQuestionViewAndEdit';

const shortid = require('shortid');

class WorkflowStepQuestion extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: 'enter',
      status: 'none',
      thinking: false,
      questionText: {},
      questionValue: null,
      machineQuestion: { nodes: [], edges: [] },
    };

    this.handleChangeQuestion = this.handleChangeQuestion.bind(this);
    this.toEdit = this.toEdit.bind(this);
    this.toValidate = this.toValidate.bind(this);
    this.getAnswers = this.getAnswers.bind(this);
    this.getMachineQuestion = this.getMachineQuestion.bind(this);
    this.fetchMachineQuestion = this.fetchMachineQuestion.bind(this);

    this.questionExamples = [
      { value: 'CD', label: 'What genes affect ebola?' },
      { value: 'GC', label: 'What genes are targeted by metformin?' },
    ];
  }

  getMachineQuestion() {
    this.setState({ thinking: true }, () => this.fetchMachineQuestion(this.state.questionText));
  }
  getAnswers() {
    // Do stuff that is important... then, possibly
    this.props.callbackEnableNextTab();
  }
  fetchMachineQuestion(questionText) {
    console.log(`Fetching machine question for: "${questionText}"`);

    // Fake it
    const machineQuestion = {
      nodes: [
        {
          id: 0,
          type: 'disease',
          name: 'Ebola',
        },
        {
          id: 1,
          type: 'gene',
          set: true,
        }
      ],
      edges: [
        {
          id: 'the_edge',
          from: 0,
          to: 1,
          predicate: 'associated_with',
        }
      ],
    };

    this.props.config.questionNewTranslate(
      questionText,
      (res) => { console.log(res); this.setState({ machineQuestion: res.body, thinking: false, status: 'good' }); },
      (res) => { console.log(res); this.setState({ machineQuestion: { nodes: [], edges: [] }, thinking: false, status: 'failure' }); }
    );
    // 400s don't go to catch? 500s do
  }

  toEdit() {
    this.setState({ show: 'enter' });
  }
  toValidate() {
    this.setState({ show: 'validate' });
  }
  handleChangeQuestion(newValue) {
    console.log(newValue);
    if (newValue && 'label' in newValue) {
      this.setState({ questionValue: newValue, questionText: newValue.label }, this.getMachineQuestion);
      return;
    }
    this.setState({ questionValue: null, questionText: '' });
  }
  render() {
    const showEnter = this.state.show === 'enter';
    const showValidate = this.state.show === 'validate';
    const showNone = this.state.status === 'none';
    const showFailure = this.state.status === 'failure';
    const showSuccess = this.state.status === 'good';
    const { thinking } = this.state;

    // <Row>
    //   <Col md={12}>
    //     <ButtonToolbar>
    //       <Button bsSize="large" onClick={this.getAnswers}>
    //         Get Answers
    //       </Button>
    //       <Button bsSize="large" onClick={this.props.callbackToNextTab}>
    //         Go to Answers
    //       </Button>
    //     </ButtonToolbar>
    //   </Col>
    // </Row>

    // 
    return (
      <div>
        <Row>
          <Col md={12}>
            {showEnter &&
              <div>
                <Row>
                  <Col md={12}>
                    <Select.Creatable
                      name="Question"
                      placeholder="Enter a Biomedical Question"
                      value={this.state.questionValue}
                      options={this.questionExamples}
                      onChange={this.handleChangeQuestion}
                      clearable
                      disabled={thinking}
                      promptTextCreator={input => ''}
                    />
                  </Col>
                </Row>
                {showNone &&
                  <Row>
                    <Col md={12}>
                      {''}
                    </Col>
                  </Row>
                }
                {showFailure &&
                  <Row>
                    <Col md={12}>
                      {"That question didn't work. Try another question."}
                    </Col>
                  </Row>
                }
                {showSuccess &&
                  <Row>
                    <Col md={12}>
                      <Button
                        bsStyle="link"
                        onClick={this.toValidate}
                      >
                        {'Explore our intepretation of this question'}
                      </Button>
                    </Col>
                  </Row>
                }
              </div>
            }
            {showValidate &&
              <div>
                <Row>
                  <Col md={12}>
                    <Button onClick={this.toEdit}>
                      Back
                    </Button>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MachineQuestionViewAndEdit
                      question={this.state.machineQuestion}
                    />
                  </Col>
                </Row>
              </div>
            }
          </Col>
        </Row>
      </div>
    );
  }
}

WorkflowStepQuestion.defaultProps = {
  data: {},
  variables: {},
  callbackEnableNextTab: () => {},
  callbackToNextTab: () => {},
};

export default WorkflowStepQuestion;
