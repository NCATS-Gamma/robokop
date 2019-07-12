import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const QuickQuestionError = (props) => {
  const { showModal, closeModal, errorMessage } = props;
  return (
    <Modal
      show={showModal}
      onHide={closeModal}
      backdrop
    >
      <Modal.Header>
        <Modal.Title>Error Answering Question</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{errorMessage}. Please try a different question.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={closeModal}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QuickQuestionError;
