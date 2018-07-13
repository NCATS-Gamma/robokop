import React from 'react';

import { Row, Col, Button, Alert, Navbar, Nav, NavItem } from 'react-bootstrap';
import Select from 'react-select';
// import FaCog from 'react-icons/lib/fa/cog';
import FaWrench from 'react-icons/lib/fa/wrench';
import FaMailReply from 'react-icons/lib/fa/mail-reply';
import FaCheck from 'react-icons/lib/fa/check';

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
      editedQuestionData: { question: '', machineQuestion: { nodes: [], edges: [] } },
      editedMachineQuestionIsValid: false,
    };

    this.handleChangeQuestion = this.handleChangeQuestion.bind(this);
    this.toMain = this.toMain.bind(this);
    this.toEdit = this.toEdit.bind(this);
    this.saveEdit = this.saveEdit.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.onNewQuestionTextOption = this.onNewQuestionTextOption.bind(this);
    this.next = this.next.bind(this);

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
    this.props.nlpParse(
      questionText,
      (res) => { this.setState({ machineQuestion: res, thinking: false, status: 'good' }); },
      (res) => { this.setState({ machineQuestion: { nodes: [], edges: [] }, thinking: false, status: 'failure' }); },
    );
  }

  onNewQuestionTextOption(newOption) {
    this.questionExamples.push(newOption)
  }

  toMain() {
    this.setState({ show: 'main' });
  }
  toEdit() {
    this.setState({
      editedQuestionData: {
        question: this.state.question,
        machineQuestion: this.state.machineQuestion,
      },
      editedMachineQuestionIsValid: true,
      show: 'edit',
    });
  }
  saveEdit() {
    const newQuestionText = this.state.editedQuestionData.question;
    const optionIndex = this.questionExamples.findIndex(opt => opt.value === this.state.questionValue.value);
    this.questionExamples[optionIndex].label = newQuestionText;
    this.setState({
      questionText: newQuestionText,
      machineQuestion: this.state.editedQuestionData.machineQuestion,
      show: 'main',
    });
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
  editorUpdate({ data, isValid }) {
    // Each time an edit is made in the editor this gets called
    // Since this object is in charge of the cancel and save buttons we keep track of the edited state
    // We can also disable the save button if it's not valid.
    this.setState({ editedQuestionData: data, editedMachineQuestionIsValid: isValid });
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
    let editorHeight = fullHeight;
    let containerStyle = { paddingLeft: '15px', paddingRight: '15px' };
    if (!(fullHeight === '100%')) {
      containerStyle = {
        ...containerStyle,
        minHeight: fullHeight,
        maxHeight: fullHeight,
        overflowY: 'scroll',
        overflowX: 'hidden',
      };

      if (!(typeof editorHeight === 'string' || editorHeight instanceof String)) {
        // editorHeight is not string subtract 30 for the bar height
        editorHeight -= 30;
      }
    }
    const { editedMachineQuestionIsValid } = this.state;

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
          <div>
            <div className="staticTop" style={{ marginLeft: -15, marginRight: -15, minHeight: 30, boxShadow: '0px 0px 5px 0px #b3b3b3' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 5, left: 15 }}>
                  <span style={{ fontSize: '18px' }} title="Revert">
                    <FaMailReply style={{ cursor: 'pointer' }} onClick={this.toMain} />
                  </span>
                </div>
                <div style={{ position: 'absolute', marginLeft: 'auto', left: '50%' }}>
                  <div style={{ position: 'relative', top: 5, left: '-50%', color: '#777' }}>
                    Graph Template Editor
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 5, right: 15 }}>
                  <span style={{ fontSize: '18px', color: editedMachineQuestionIsValid ? '#000' : '#ddd' }} title="Accept Changes">
                    <FaCheck style={{ cursor: editedMachineQuestionIsValid ? 'pointer' : 'default' }} onClick={editedMachineQuestionIsValid ? this.saveEdit : () => {} } />
                  </span>
                </div>
              </div>
            </div>
            <Row>
              <Col md={12}>
                <MachineQuestionEditor
                  height={editorHeight}
                  concepts={this.props.concepts}
                  question={this.state.questionText}
                  machineQuestion={this.state.machineQuestion}
                  onUpdate={this.editorUpdate}
                />
              </Col>
            </Row>
          </div>
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
