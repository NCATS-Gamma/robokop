import React from 'react';

import { Grid, Row, Col, FormControl } from 'react-bootstrap';

const shortid = require('shortid');

class QuestionMetaEditor extends React.Component {
  constructor(props) {
    super(props);

    this.onUpdate = this.onUpdate.bind(this);
  }

  onUpdate(newMeta) {
    //const newMeta = An object of question meta data to be set
    this.props.callbackUpdate(newMeta);
  }

  render() {
    const natural = this.props.question.natural_question;
    const {
      name,
      user,
      notes,
      hash,
    } = this.props.question;
    
    return (
      <div>
        <h2>{name}</h2>
        <h4>{natural}</h4>
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
