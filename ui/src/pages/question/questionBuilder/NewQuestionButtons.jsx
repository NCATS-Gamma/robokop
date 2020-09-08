import React from 'react';
import { Button } from 'react-bootstrap';

import { FaDownload, FaPaperPlane, FaTrash } from 'react-icons/fa';

/**
 * Footer buttons for new question page
 * @param {function} onDownloadQuestion - function for when the user downloads a question
 * @param {function} onResetQuestion - function to delete the current question and start over
 * @param {function} onSubmitQuestion - function to load a question graph based on the question
 * @param {boolean} validQuestion - boolean
 */
class NewQuestionButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      onDownloadQuestion, onResetQuestion,
      onSubmitQuestion, validQuestion,
    } = this.props;
    const buttonStyles = { padding: '5px', marginLeft: '10px' };
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
          disabled={!validQuestion}
          title="Download Machine Question as JSON"
          onClick={onDownloadQuestion}
        >
          <span>
            Download <span style={{ fontSize: '22px' }}><FaDownload style={{ cursor: 'pointer' }} /></span>
          </span>
        </Button>
        <Button
          style={buttonStyles}
          className="btn btn-default"
          disabled={!validQuestion}
          title="Submit question"
          onClick={onSubmitQuestion}
        >
          <span>
            Submit <span style={{ fontSize: '22px' }}><FaPaperPlane style={{ cursor: 'pointer' }} /></span>
          </span>
        </Button>
      </div>
    );
  }
}

export default NewQuestionButtons;
