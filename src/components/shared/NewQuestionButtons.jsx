import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import Dropzone from 'react-dropzone';

import FaDownload from 'react-icons/lib/fa/download';
import FaUpload from 'react-icons/lib/fa/upload';
import FaPaperPlaneO from 'react-icons/lib/fa/paper-plane-o';
import FaTrash from 'react-icons/lib/fa/trash';

const shortid = require('shortid');

/**
 * Header buttons for new question page
 * @param {function} onDropFile - function to be called when a user uploads a file
 * @param {function} onDownloadQuestion - function for when the user downloads a question
 * @param {function} onResetQuestion - function to delete the current question and start over
 * @param {function} onSubmitQuestion - function to load a question graph based on the question
 * @param {object} graphValidationState - object of booleans and an error array
 * @param {array} questionList - an array of questions for the question template dropdown
 * @param {function} onQuestionTemplate - function for when the user selects a pre-existing question template
 */
class NewQuestionButtons extends React.PureComponent {
  render() {
    const {
      onDropFile, onDownloadQuestion, onResetQuestion,
      onSubmitQuestion, graphValidationState, questionList, onQuestionTemplate,
    } = this.props;
    const buttonStyles = { padding: '5px', marginLeft: '10px' };
    const isValidQuestion = graphValidationState.isValid;
    const errorMsg = 'Error: '.concat(graphValidationState.errorList.join(',\n '));
    return (
      <div style={{ position: 'relative', float: 'right', margin: '20px 0px' }}>
        <DropdownButton
          bsStyle="default"
          title="Load a question template"
          key={1}
          id="dropdown-question-template"
        >
          {questionList.map((question, i) => <MenuItem key={shortid.generate()} eventKey={i} onSelect={onQuestionTemplate}>{question.natural_question}</MenuItem>)}
        </DropdownButton>
        <button
          style={buttonStyles}
          className="btn btn-default"
          disabled={!isValidQuestion}
          title={isValidQuestion ? 'Submit question' : errorMsg}
          onClick={onSubmitQuestion}
        >
          <span style={{ fontSize: '22px' }}>
            <FaPaperPlaneO style={{ cursor: 'pointer' }} />
          </span>
        </button>
        <button
          style={buttonStyles}
          className="btn btn-default"
        >
          <span style={{ fontSize: '22px' }} title="Import Machine Question from JSON">
            <Dropzone
              onDrop={onDropFile}
              multiple={false}
              style={{
                border: 'none',
              }}
            >
              <FaUpload style={{ cursor: 'pointer' }} />
            </Dropzone>
          </span>
        </button>
        <button
          style={buttonStyles}
          className="btn btn-default"
          disabled={!isValidQuestion}
          title={isValidQuestion ? 'Download Machine Question as JSON' : errorMsg}
          onClick={onDownloadQuestion}
        >
          <span style={{ fontSize: '22px' }}>
            <FaDownload style={{ cursor: 'pointer' }} />
          </span>
        </button>
        {/* Delete/ Reset Graph Button */}
        <button
          style={buttonStyles}
          className="btn btn-default"
          onClick={onResetQuestion}
        >
          <span style={{ fontSize: '22px' }} title="Reset Machine Question editor">
            <FaTrash style={{ cursor: 'pointer' }} />
          </span>
        </button>
      </div>
    );
  }
}

export default NewQuestionButtons;
