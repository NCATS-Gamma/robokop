import React from 'react';

import { Row, Col, Alert, FormGroup, FormControl, Popover, OverlayTrigger, ProgressBar, DropdownButton, MenuItem } from 'react-bootstrap';

import GoPencil from 'react-icons/lib/go/pencil';
import FaDownload from 'react-icons/lib/fa/download';
import FaInfoCircle from 'react-icons/lib/fa/info-circle';
// import FaClone from 'react-icons/lib/fa/clone';

import QuestionToolbar from './QuestionToolbar';
import TasksModal from './taskModal/TasksModal';

const timestampToTimeString = (ts) => {
  let ts2 = ts;
  if (ts instanceof String) {
    if (!ts.endsWith('Z')) {
      ts2 = `${ts2}Z`;
    }
    const d = new Date(ts2);
    return d.toLocaleString();
  }
  return '';
};

const _ = require('lodash');
const shortid = require('shortid');

class QuestionHeader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editedNatural: false,
      editedNotes: false,
      notes: '',
      natural: '',
      showModal: false,
    };

    this.onEditNatural = this.onEditNatural.bind(this);
    this.onEditNotes = this.onEditNotes.bind(this);
    this.onSave = this.onSave.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    this.syncPropsAndState(this.props);
  }
  shouldComponentUpdate(newProps, newState) {
    const propsAllMatch = (newProps.editedNatural === this.props.editedNatural) &&
      (newProps.editedNotes === this.props.editedNotes) &&
      (('natural_question' in newProps.question) && ('natural_question' in this.props.question) && (newProps.question.natural_question === this.props.question.natural_question)) &&
      (('notes' in newProps.question) && ('notes' in this.props.question) && (newProps.question.notes === this.props.question.notes)) &&
      (newProps.showToolbar === this.props.showToolbar) &&
      (newProps.refreshBusy === this.props.refreshBusy) &&
      (newProps.answerBusy === this.props.answerBusy) &&
      (newProps.enableNewAnswersets === this.props.enableNewAnswersets) &&
      (newProps.enableQuestionRefresh === this.props.enableQuestionRefresh) &&
      (newProps.enableQuestionEdit === this.props.enableQuestionEdit) &&
      (newProps.enableQuestionDelete === this.props.enableQuestionDelete) &&
      (newProps.enableQuestionFork === this.props.enableQuestionFork) &&
      (newProps.enableTaskStatus === this.props.enableTaskStatus) &&
      (newProps.enableQuestionSelect === this.props.enableQuestionSelect) &&
      (newProps.showOtherQuestions === this.props.showOtherQuestions) &&
      _.isEqual(newProps.otherQuestions, this.props.otherQuestions) &&
      (newProps.showOtherAnswersets === this.props.showOtherAnswersets) &&
      _.isEqual(newProps.otherAnswersets, this.props.otherAnswersets) &&
      (newProps.showDownload === this.props.showDownload);

    const stateAllMatch = (newState.editedNatural === this.state.editedNatural) &&
      (newState.editedNotes === this.state.editedNotes) &&
      (newState.notes === this.state.notes) &&
      (newState.natural === this.state.natural) &&
      (newState.showModal === this.state.showModal);

    return !(propsAllMatch && stateAllMatch);
  }

  onEditNatural(e) {
    this.setState({ editedNatural: true, natural: e.target.value });
  }
  onEditNotes(e) {
    this.setState({ editedNotes: true, notes: e.target.value });
  }
  toggleModal() {
    this.setState(prevState => ({ showModal: !prevState.showModal }));
  }
  onSave() {
    const newMeta = {
      question_id: this.props.question.id,
      natural_question: this.state.natural,
      notes: this.state.notes,
    };

    this.props.callbackUpdate(
      newMeta,
      () => this.setState({ editedNatural: false, editedNotes: false }),
    );
  }

  syncPropsAndState(newProps) {
    this.setState({
      editedNatural: false,
      editedNotes: false,
      natural: newProps.question.natural_question,
      notes: newProps.question.notes,
    });
  }

  render() {
    const {
      notes,
      natural,
    } = this.state;

    const popoverEditNatural = (
      <Popover id="popover-edit-natural" title="Edit Question" style={{ minWidth: '500px' }}>
        <FormGroup role="form">
          <p>
          At this point our interpretation of your question is fixed. This will not cause a re-evaluation of your question. This is only used to correct typos etc.
          </p>
          <FormControl
            type="text"
            value={natural}
            placeholder="Question?"
            onChange={this.onEditNatural}
          />
        </FormGroup>
      </Popover>
    );

    const editNaturalNode = (
      <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={popoverEditNatural}>
        <GoPencil />
      </OverlayTrigger>
    );

    const edited = this.state.editedNatural || this.state.editedNotes;
    const active = this.props.refreshBusy || this.props.answerBusy;

    const notesStyle = {
      minHeight: '50px',
      resize: 'vertical',
    };
    if (!this.props.enableQuestionEdit) {
      notesStyle.color = '#000';
      notesStyle.background = '#fff';
    }

    let activityMessage = '';
    if (this.props.refreshBusy) {
      activityMessage = 'Knowledge Graph Update in Progress';
    }
    if (this.props.answerBusy) {
      activityMessage = 'Getting Answers';
    }

    const otherAnswersetMenuItemList = this.props.otherAnswersets.map((a, i) => {
      let timeString = new Date().toLocalString();
      if ('datetime' in a) {
        timeString = timestampToTimeString(a.datetime);
      }
      return (
        <MenuItem
          eventKey={`${i + 2}`}
          key={shortid.generate()}
          href={this.props.urlAnswerset(a)}
        >
          {timeString} - {a.creator}
        </MenuItem>
      );
    });
    let answersetTime = new Date().toLocaleString();
    if (('answerset' in this.props) && ('datetime' in this.props.answerset)) {
      answersetTime = timestampToTimeString(this.props.answerset.datetime);
    }
    let creator = 'Reasoner';
    if (('answerset' in this.props) && ('creator' in this.props.answerset)) {
      ({ creator } = this.props.answerset);
    }
    const answersetMenuItemList = [
      <MenuItem
        eventKey="1"
        key={shortid.generate()}
        active
      >
        {`${answersetTime} - ${creator}`}
      </MenuItem>,
    ].concat(otherAnswersetMenuItemList);

    const otherQuestionsMenuItemList = this.props.otherQuestions.map((q, i) => (
      <MenuItem
        eventKey={`${i + 2}`}
        key={shortid.generate()}
        href={this.props.urlQuestion(q)}
      >
        {q.natural_question}
      </MenuItem>
    ));
    const questionMenuItemList = [
      <MenuItem eventKey="1" key={shortid.generate()} active>
        {this.state.natural}
      </MenuItem>,
    ].concat(otherQuestionsMenuItemList);

    return (
      <div>
        <TasksModal question={this.props.question} user={this.props.user} showModal={this.state.showModal} toggleModal={this.toggleModal} />
        <Row>
          <Col md={12}>
            {active &&
              <Alert bsStyle="success" style={{ padding: '5px 10px 5px 10px' }}>
                {activityMessage}
                <ProgressBar striped active style={{ marginBottom: '5px' }} bsStyle="success" now={100} />
              </Alert>
            }
            <div style={{ position: 'block', paddingBottom: '10px' }}>
              <h1 style={{ display: 'inline' }}>
                {this.props.enableQuestionSelect &&
                  <a style={{ color: 'inherit' }} href={this.props.urlQuestion(this.props.question)}>{natural}</a>
                }
                {!this.props.enableQuestionSelect &&
                  natural
                }
                {this.props.enableQuestionEdit &&
                  <div style={{ display: 'inline', fontSize: '12px' }}>
                    &nbsp;
                    &nbsp;
                    {editNaturalNode}
                  </div>
                }
              </h1>
              {this.props.questionGraphPopover &&
                <span style={{ paddingLeft: '20px', fontSize: '30px' }}>
                  <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={this.props.questionGraphPopover}>
                    <FaInfoCircle size={25} />
                  </OverlayTrigger>
                </span>
              }
              <div className="pull-right" style={{ marginTop: '10px' }}>
                {edited &&
                  <div style={{ display: 'inline' }}>
                    <Alert
                      bsStyle="warning"
                      style={{
                        fontSize: '12px',
                        display: 'inline',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                      }}
                    >
                      You have unsaved changes! <button onClick={this.onSave} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Save Now</button>
                    </Alert>
                    &nbsp;
                    &nbsp;
                  </div>
                }
                {this.props.showOtherQuestions && questionMenuItemList.length > 1 &&
                  <DropdownButton id="diminisheddropdown" noCaret title="Similar Questions">
                    {questionMenuItemList}
                  </DropdownButton>
                }
                {this.props.showOtherAnswersets && answersetMenuItemList.length > 1 &&
                  <DropdownButton id="diminisheddropdown" noCaret title="Other Answersets">
                    {answersetMenuItemList}
                  </DropdownButton>
                }
                {this.props.showToolbar &&
                  <QuestionToolbar
                    callbackNewAnswerset={this.props.callbackNewAnswerset}
                    callbackRefresh={this.props.callbackRefresh}
                    callbackFork={this.props.callbackFork}
                    callbackTaskStatus={this.toggleModal}
                    callbackDelete={this.props.callbackDelete}

                    enableNewAnswersets={this.props.enableNewAnswersets && !active}
                    enableQuestionRefresh={this.props.enableQuestionRefresh && !active}
                    enableQuestionDelete={this.props.enableQuestionDelete && !active}
                    enableQuestionFork={this.props.enableQuestionFork}
                    enableTaskStatus={this.props.enableTaskStatus && active}
                  />
                }
                {this.props.showDownload &&
                  <span style={{ fontSize: '22px' }} title="Download">
                    <FaDownload style={{ cursor: 'pointer' }} onClick={() => this.props.callbackDownload()} />
                  </span>
                }
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col id="questionNotes" md={12}>
            <FormControl
              disabled={!this.props.enableQuestionEdit}
              componentClass="textarea"
              placeholder="User Notes"
              style={notesStyle}
              inputRef={(ref) => { this.notesRef = ref; }}
              value={notes}
              onChange={this.onEditNotes}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

QuestionHeader.defaultProps = {
  question: {},
  showToolbar: false,
  refreshBusy: false,
  answerBusy: false,

  callbackNewAnswerset: () => {},
  callbackRefresh: () => {},
  callbackUpdate: () => {},
  callbackFork: () => {},
  callbackDelete: () => {},

  enableNewAnswersets: false,
  enableQuestionRefresh: false,
  enableQuestionEdit: false,
  enableQuestionDelete: false,
  enableQuestionFork: false,

  enableQuestionSelect: false,

  showOtherQuestions: false,
  otherQuestions: [],
  callbackQuestionSelect: () => {},
  urlQuestion: () => {},

  showOtherAnswersets: false,
  otherAnswersets: [],
  callbackAnswersetSelect: () => {},
  urlAnswerset: () => {},

  showDownload: false,
  callbackDownload: () => {},
};

export default QuestionHeader;
