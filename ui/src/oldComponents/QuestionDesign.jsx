import React from 'react';

import { Row, Col, Button, Alert } from 'react-bootstrap';

import { FaWrench } from 'react-icons/fa';

import Loading from '../Loading';
import InputOptions from './InputOptions';
import QuestionGraphView from './graphs/QuestionGraphView';
import MachineQuestionEditor from './MachineQuestionEditor';

class QuestionDesign extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: 'main', // main, edit
      status: 'none', // none, good, failure
      thinking: false,
      initialQuestionText: null,
      questionText: {},
      machineQuestion: { nodes: [], edges: [] },
    };

    this.onInitialize = this.onInitialize.bind(this);

    this.handleSelectQuestion = this.handleSelectQuestion.bind(this);
    this.handleChangeQuestion = this.handleChangeQuestion.bind(this);

    this.toMain = this.toMain.bind(this);
    this.toEdit = this.toEdit.bind(this);
    this.saveEdit = this.saveEdit.bind(this);
    this.next = this.next.bind(this);

    this.getMachineQuestion = this.getMachineQuestion.bind(this);
    this.fetchMachineQuestion = this.fetchMachineQuestion.bind(this);

    this.questionExamples = [
      'What genes affect ebola hemorrhagic fever?',
      'What is the COP for imatinib and asthma?',
      'What genetic conditions protect against ebola hemorrhagic fever?',
    ];
  }

  componentDidMount() {
    this.onInitialize(this.props);
  }

  onInitialize(props) {
    // On initialization we might have an question data from a fork
    // Or it could be null

    // At this point we need to set the query to match the previous question
    if (props.initializationData && (typeof props.initializationData === 'object') && ('question' in props.initializationData) && ('machineQuestion' in props.initializationData)) {
      if (props.initializationData.question && props.initializationData.machineQuestion) {
        // We have the data to prepopulate the question designer
        this.setState({
          initialQuestionText: props.initializationData.question,
          questionText: props.initializationData.question,
          machineQuestion: props.initializationData.machineQuestion,
          status: 'good',
        });
      }
    }
  }

  getMachineQuestion() {
    this.setState({ thinking: true }, () => this.fetchMachineQuestion(this.state.questionText));
  }
  fetchMachineQuestion(questionText) {
    this.props.nlpParse(
      questionText,
      (res) => { this.setState({ machineQuestion: res, thinking: false, status: 'good' }); },
      () => { this.setState({ machineQuestion: { nodes: [], edges: [] }, thinking: false, status: 'failure' }); },
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
      // Set the data that came back from the editor
      this.setState({
        questionText: newQuestionText,
        initialQuestionText: newQuestionText, // Also set this so when we remount the combobox
        machineQuestion: data.machineQuestion,
        show: 'main',
      });
      return;
    }
    // Somehow an inValid question came back -- Abort
    this.setState({ show: 'main' });
  }
  handleChangeQuestion(newValue) {
    // We also change the initialQuestionText for the case when we remount for somereason.
    this.setState({ questionText: newValue, machineQuestion: { nodes: [], edges: [] }, initialQuestionText: newValue });
  }
  handleSelectQuestion(newValue) {
    // When you hit enter or click on an option in the comboox
    // Check if what we typed matches one of the options
    if (newValue) {
      // We got a valid natural language quesiton we need to attempt to parse it into a machine question
      this.setState({ status: 'none', questionText: newValue, initialQuestionText: newValue }, this.getMachineQuestion);
      return;
    }
    // A clear or bunk value, abort
    this.setState({
      questionText: '',
      initialQuestionText: '',
      status: 'none',
      machineQuestion: { nodes: [], edges: [] },
    });
  }

  next() {
    this.props.nextCallback({ questionText: this.state.questionText, machineQuestion: this.state.machineQuestion });
  }
  render() {
    const showMain = this.state.show === 'main';
    const showNone = this.state.status === 'none';
    const showFailure = this.state.status === 'failure';
    const showSuccess = this.state.status === 'good';
    const showEdit = this.state.show === 'edit';
    const { thinking } = this.state;

    const fullHeight = this.props.height;
    let viewHeight = 300;
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
    if (!(typeof fullHeight === 'string' || fullHeight instanceof String)) {
      // innerHeight is not string subtract topBarHeight for the bar height
      viewHeight = Math.max(viewHeight, fullHeight - 300);
    }

    let inputOptions = this.questionExamples;
    if (typeof this.state.questionText === 'string' || this.state.questionText instanceof String) {
      inputOptions = [this.state.questionText].concat(this.questionExamples);
    }

    return (
      <div style={containerStyle}>
        {showMain &&
          <div>
            <Row style={{ paddingTop: '20px' }}>
              <Col md={12}>
                <div id="QuestionInput">
                  <InputOptions
                    defaultValue={this.state.initialQuestionText}
                    options={inputOptions}
                    placeholder="Enter a Biomedical Question"
                    onChange={this.handleChangeQuestion}
                    onSelect={this.handleSelectQuestion}
                    busy={thinking}
                    disable={thinking}
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
                    <QuestionGraphView
                      height={viewHeight}
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
  initializationData: null,
  height: '100%',
  nextText: 'Get Answers',
  nextCallback: () => {},
  variables: {},
};
// nlpParse - is required
// concepts - is required

export default QuestionDesign;
