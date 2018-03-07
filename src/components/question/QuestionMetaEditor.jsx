import React from 'react';

import { Alert, FormGroup, FormControl, ControlLabel, Popover, OverlayTrigger } from 'react-bootstrap';

import IoEdit from 'react-icons/io/edit';

const shortid = require('shortid');

class QuestionMetaEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editedName: false,
      editedNatural: false,
      editedNotes: false,
      name: '',
      user: '',
      notes: '',
      natural: '',
    };

    this.onEditName = this.onEditName.bind(this);
    this.onEditNatural = this.onEditNatural.bind(this);
    this.onEditNotes = this.onEditNotes.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidMount() {
    this.syncPropsAndState(this.props);
  }

  onEditName(e) {
    this.setState({ editedName: true, name: e.target.value });
  }

  onEditNatural(e) {
    this.setState({ editedNatural: true, natural: e.target.value });
  }
  onEditNotes(e) {
    this.setState({ editedNotes: true, natural: e.target.value });
  }
  onSave() {
    const newMeta = {
      natural_question: this.state.natural,
      name: this.state.name,
      notes: this.state.notes,
    };

    this.props.callbackUpdate(newMeta);
  }

  onPopoverSubmit() {
    console.log('pop over submit');
  }

  syncPropsAndState(newProps) {
    this.setState({
      editedName: false,
      editedNatural: false,
      editedNotes: false,
      name: newProps.question.name,
      natural: newProps.question.natural_question,
      notes: newProps.question.notes,
      user: newProps.question.user,
    });
  }

  render() {
    const {
      name,
      user,
      notes,
      hash,
      natural,
    } = this.state;

    const popoverEditName = (
      <Popover id="popover-edit-name" title="Edit Question Name">
        <FormGroup role="form">
          <FormControl
            type="text"
            value={name}
            placeholder="Question Name"
            onChange={this.onEditName}
          />
        </FormGroup>
      </Popover>
    );

    const editNameNode = (
      <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={popoverEditName} container={this}>
        <IoEdit />
      </OverlayTrigger>
    );

    const popoverEditNatural = (
      <Popover id="popover-edit-natural" title="Edit Question">
        <FormGroup role="form">
          <ControlLabel>This will not cause a re-evaluation of your question. This is only used to correct typos etc.</ControlLabel>
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
      <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={popoverEditNatural} container={this}>
        <IoEdit />
      </OverlayTrigger>
    );


    const edited = this.state.editedName || this.state.editedNatural || this.state.editedNotes;

    return (
      <div>
        {edited &&
          <Alert bsStyle="warning">
            You have unsaved changes! <span onClick={this.onSave} style={{ cursor: 'pointer', textDecoration: 'underline'}}>Save Now</span>
          </Alert>
        }
        <div>
          <h2>
            {name}
            {this.props.editable &&
              editNameNode
            }
          </h2>
        </div>
        <h4>
          {natural}
          {this.props.editable &&
            editNaturalNode
          }
        </h4>
        <h5>{user}</h5>
        <p>{hash}</p>
        <FormControl
          componentClass="textarea"
          placeholder="Notes"
          inputRef={(ref) => { this.notesRef = ref; }}
          data={notes}
        />
      </div>
    );
  }
}

export default QuestionMetaEditor;
