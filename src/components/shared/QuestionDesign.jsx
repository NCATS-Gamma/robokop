import React from 'react';

import { Row, Col, Button, Alert } from 'react-bootstrap';
import Select from 'react-select';

import FaWrench from 'react-icons/lib/fa/wrench';

import Loading from '../Loading';
import MachineQuestionView from './MachineQuestionView';
import MachineQuestionEditor from './MachineQuestionEditor';

class QuestionDesign extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: 'main', // main, edit
      status: 'none', // none, good, failure
      thinking: false,
      questionText: {},
      questionValue: null,
      machineQuestion: { nodes: [], edges: [] },
    };

    this.handleChangeQuestion = this.handleChangeQuestion.bind(this);
    this.toMain = this.toMain.bind(this);
    this.toEdit = this.toEdit.bind(this);
    this.saveEdit = this.saveEdit.bind(this);
    this.onNewQuestionTextOption = this.onNewQuestionTextOption.bind(this);
    this.next = this.next.bind(this);

    this.getAnswers = this.getAnswers.bind(this);
    this.getMachineQuestion = this.getMachineQuestion.bind(this);
    this.fetchMachineQuestion = this.fetchMachineQuestion.bind(this);

    this.questionExamples = [
      { value: 'CD', label: 'What genes affect ebola?' },
      { value: 'COP', label: 'What is the COP for imatinib and asthma?' },
      { value: 'CPD', label: 'What genetic conditions protect against ebola?' },
    ];
  }

  onNewQuestionTextOption(newOption) {
    this.questionExamples.push(newOption);
  }
  getMachineQuestion() {
    this.setState({ thinking: true }, () => this.fetchMachineQuestion(this.state.questionText));
  }
  getAnswers() {
    // Do stuff that is important... then, possibly
    this.props.callbackEnableNextTab();
  }
  fetchMachineQuestion(questionText) {
    this.props.nlpParse(
      questionText,
      (res) => { this.setState({ machineQuestion: res, thinking: false, status: 'good' }); },
      (res) => { this.setState({ machineQuestion: { nodes: [], edges: [] }, thinking: false, status: 'failure' }); },
    );
  }

  toMain() {
    this.setState({ show: 'main' });
  }
  toEdit() {
    this.setState({ show: 'edit' });
  }
  saveEdit({ data, isValid }) {
    if (isValid) {
      const newQuestionText = data.question;
      // Find the Select option index corresponding to this selection (over write the label appropriately)
      const optionIndex = this.questionExamples.findIndex(opt => opt.value === this.state.questionValue.value);
      this.questionExamples[optionIndex].label = newQuestionText;

      // Set the data that came back from the editor
      this.setState({
        questionText: newQuestionText,
        machineQuestion: data.machineQuestion,
        show: 'main',
      });
      return;
    }
    // Somehow an inValid question came back -- Abort
    this.setState({ show: 'main' });
  }
  handleChangeQuestion(newValue) {
    // Callback method for react select
    if (newValue && 'label' in newValue) {
      // We got a valid natural language quesiton we need to attempt to parse it into a machine question
      this.setState({ status: 'none', questionValue: newValue, questionText: newValue.label }, this.getMachineQuestion);
      return;
    }
    // A clear or bunk value, abort
    this.setState({
      questionValue: null,
      questionText: '',
      status: 'none',
      machineQuestion: { nodes: [], edges: [] },
    });
  }

  next() {
    this.props.nextCallback({ question: this.state.questionText, machineQuestion: this.state.machineQuestion });
  }
  render() {
    const showMain = this.state.show === 'main';
    const showNone = this.state.status === 'none';
    const showFailure = this.state.status === 'failure';
    const showSuccess = this.state.status === 'good';
    const showEdit = this.state.show === 'edit';
    const { thinking } = this.state;

    const fullHeight = this.props.height;
    let containerStyle = { paddingLeft: '15px', paddingRight: '15px' };
    if (!(fullHeight === '100%')) {
      containerStyle = {
        ...containerStyle,
        minHeight: fullHeight,
        maxHeight: fullHeight,
        overflowY: 'scroll',
        overflowX: 'hidden',
      };
    }
    return (
      <div style={containerStyle}>
        {showMain &&
          <div>
            <Row style={{ paddingTop: '20px' }}>
              <Col md={12}>
                <div id="QuestionInput">
                  <Select.Creatable
                    name="Question"
                    placeholder="Enter a Biomedical Question"
                    value={this.state.questionValue}
                    options={this.questionExamples}
                    onChange={this.handleChangeQuestion}
                    onNewOptionClick={this.onNewQuestionTextOption}
                    clearable
                    autoFocus
                    disabled={thinking}
                    promptTextCreator={() => ''}
                  />
                </div>
              </Col>
            </Row>
            {thinking &&
              <Row>
                <Col md={12}>
                  <Loading />
                </Col>
              </Row>
            }
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
                  <Alert bsStyle="danger">
                    <strong>Uh Oh!</strong> {"That question didn't work. Try another question."}
                  </Alert>
                </Col>
              </Row>
            }
            {showSuccess &&
              <div style={{ paddingTop: '20px' }}>
                <Row>
                  <Col md={12}>
                    <h4>
                      Your question has been interpreted into the following graph template:
                      <div className="pull-right">
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', top: -2, right: 0 }}>
                            <span style={{ fontSize: '18px' }} title="Manually Edit Graph Template">
                              <FaWrench style={{ cursor: 'pointer' }} onClick={this.toEdit} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </h4>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MachineQuestionView
                      height={300}
                      question={this.state.machineQuestion}
                      concepts={this.props.concepts}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={2} mdOffset={5}>
                    <Button bsSize="large" bsStyle="primary" onClick={this.next}>
                      {this.props.nextText}
                    </Button>
                  </Col>
                </Row>
              </div>
            }
          </div>
        }
        {showEdit &&
          <Row>
            <Col md={12}>
              <MachineQuestionEditor
                height={fullHeight}
                concepts={this.props.concepts}
                question={this.state.questionText}
                machineQuestion={this.state.machineQuestion}
                // onUpdate={this.editorUpdate}
                callbackSave={this.saveEdit}
                callbackCancel={this.toMain}
              />
            </Col>
          </Row>
        }
      </div>
    );
  }
}

QuestionDesign.defaultProps = {
  height: '100%',
  nextText: 'Get Answers',
  nextCallback: () => {},
  inputData: {},
  variables: {},
};
// nlpParse - is required
// concepts - is required

export default QuestionDesign;
