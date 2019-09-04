import React from 'react';
import { Button } from 'react-bootstrap';

import FaDownload from 'react-icons/lib/fa/download';
import FaPaperPlaneO from 'react-icons/lib/fa/paper-plane-o';
import FaTrash from 'react-icons/lib/fa/trash';

/**
 * Header buttons for new question page
 * @param {function} onDropFile - function to be called when a user uploads a file
 * @param {function} onDownloadQuestion - function for when the user downloads a question
 * @param {function} onResetQuestion - function to delete the current question and start over
 * @param {function} onSubmitQuestion - function to load a question graph based on the question
 * @param {object} graphValidationState - object of booleans and an error array
 * @param {array} questionList - an array of questions for the question template dropdown
 * @param {function} onQuestionTemplate - function that loads a question based on the question object it is passed
 */
class NewQuestionButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      onDownloadQuestion, onResetQuestion,
      onSubmitQuestion, graphValidationState,
    } = this.props;
    const buttonStyles = { padding: '5px', marginLeft: '10px' };
    const isValidQuestion = graphValidationState.isValid;
    const errorMsg = 'Error: '.concat(graphValidationState.errorList.join(',\n '));
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '20px 0px' }}>
        {/* Delete/ Reset Graph Button */}
        <Button
          style={buttonStyles}
          className="btn btn-default"
          onClick={onResetQuestion}
          title="Reset Machine Question editor"
        >
          <span>
            Reset <span style={{ fontSize: '22px' }}><FaTrash style={{ cursor: 'pointer' }} /></span>
          </span>
        </Button>
        <Button
          style={buttonStyles}
          className="btn btn-default"
          disabled={!isValidQuestion}
          title={isValidQuestion ? 'Download Machine Question as JSON' : errorMsg}
          onClick={onDownloadQuestion}
        >
          <span>
            Download <span style={{ fontSize: '22px' }}><FaDownload style={{ cursor: 'pointer' }} /></span>
          </span>
        </Button>
        <Button
          style={buttonStyles}
          className="btn btn-default"
          disabled={!isValidQuestion}
          title={isValidQuestion ? 'Submit question' : errorMsg}
          onClick={onSubmitQuestion}
        >
          <span>
            Submit <span style={{ fontSize: '22px' }}><FaPaperPlaneO style={{ cursor: 'pointer' }} /></span>
          </span>
        </Button>
      </div>
    );
  }
}

export default NewQuestionButtons;
