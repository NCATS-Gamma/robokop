import React from 'react';

import { Grid, Row, Col, Alert, FormGroup, FormControl, ControlLabel, Popover, OverlayTrigger } from 'react-bootstrap';

import GoPencil from 'react-icons/lib/go/pencil';

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
    this.setState({ editedNotes: true, notes: e.target.value });
  }
  onSave() {
    const newMeta = {
      question_id: this.props.question.id,
      natural_question: this.state.natural,
      name: this.state.name,
      notes: this.state.notes,
    };

    this.props.callbackUpdate(
      newMeta,
      () => this.setState({ editedNotes: false }),
    );
  }

  syncPropsAndState(newProps) {
    this.setState({
      editedName: false,
      editedNatural: false,
      editedNotes: false,
      name: newProps.question.name,
      natural: newProps.question.natural_question,
      notes: newProps.question.notes,
    });
  }

  render() {
    const {
      name,
      notes,
      natural,
    } = this.state;

    const popoverEditName = (
      <Popover id="popover-edit-name" title="Edit Question Name" style={{ minWidth: '500px' }}>
        <FormGroup role="form">
          <ControlLabel>This will change the public name of this quesiton and will impact how this question shows up in search results.</ControlLabel>
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
        <GoPencil />
      </OverlayTrigger>
    );

    const popoverEditNatural = (
      <Popover id="popover-edit-natural" title="Edit Question" style={{ minWidth: '500px' }}>
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
        <GoPencil />
      </OverlayTrigger>
    );

    const edited = this.state.editedName || this.state.editedNatural || this.state.editedNotes;

    return (
      <div>
        <Row>
          <Col md={12}>
            <h2 style={{ display: 'inline' }}>
              {name}
            </h2>
            {this.props.editable &&
              <div style={{ display: 'inline' }}>
                &nbsp;
                &nbsp;
                {editNameNode}
              </div>
            }
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <h4 style={{ display: 'inline' }}>
              {natural}
            </h4>
            {this.props.editable &&
              <div style={{ display: 'inline' }}>
                &nbsp;
                &nbsp;
                {editNaturalNode}
              </div>
            }
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <h5>
              User Notes:
            </h5>
            <FormControl
              disabled={!this.props.editable}
              componentClass="textarea"
              placeholder="Notes"
              style={{ minHeight: '200px' }}
              inputRef={(ref) => { this.notesRef = ref; }}
              value={notes}
              onChange={this.onEditNotes}
            />
          </Col>
        </Row>
        {edited &&
          <Row>
            <Col md={12}>
              <Alert bsStyle="warning">
                You have unsaved changes! <span onClick={this.onSave} style={{ cursor: 'pointer', textDecoration: 'underline'}}>Save Now</span>
              </Alert>
            </Col>
          </Row>
        }
      </div>
    );
  }
}

export default QuestionMetaEditor;
