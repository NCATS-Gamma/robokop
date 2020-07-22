import React from 'react';
import { Modal } from 'react-bootstrap';

import Loading from '../../Loading';

const LoadingNlpQuestionModal = (
  <Modal show bsSize="large">
    <Modal.Header>
      <Modal.Title id="loading-nlp-question">Submitting question to NLP Parser</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>Your natural language question is being parsed by the NLP engine. Please wait...</p>
      <Loading />
    </Modal.Body>
  </Modal>
);

export default LoadingNlpQuestionModal;
