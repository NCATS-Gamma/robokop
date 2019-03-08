import React from 'react';
import { Modal, DropdownButton, MenuItem } from 'react-bootstrap';
// import { AutoSizer, List } from 'react-virtualized';

const shortid = require('shortid');

class QuestionTemplateModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      questionTemplate: '',
    };

    this.selectQuestion = this.selectQuestion.bind(this);
    this.submitTemplate = this.submitTemplate.bind(this);
  }

  selectQuestion(event) {
    this.setState({ questionTemplate: event });
  }

  submitTemplate() {
    this.props.toggleModal();
    this.props.selectQuestion(this.state.questionTemplate);
  }

  render() {
    const {
      showModal, toggleModal, questions,
    } = this.props;
    return (
      <Modal
        show={showModal}
        onHide={toggleModal}
        backdrop
      >
        <Modal.Header closeButton>
          <Modal.Title>Question Templates</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            value={this.state.questionTemplate}
            disabled
            placeholder="Please select a question template to get started."
            style={{ display: 'block', width: '100%', margin: '20px 0px' }}
          />
          <DropdownButton
            bsStyle="default"
            title="Load a question template"
            key={1}
            id="dropdown-question-template"
          >
            {questions.map(question => (
              <MenuItem
                key={shortid.generate()}
                eventKey={question.natural_question}
                onSelect={this.selectQuestion}
              >
                {question.natural_question}
              </MenuItem>))
            }
          </DropdownButton>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={this.submitTemplate} >Load Question</button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default QuestionTemplateModal;
