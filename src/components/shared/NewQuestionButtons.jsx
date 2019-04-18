import React from 'react';
import Dropzone from 'react-dropzone';

import FaDownload from 'react-icons/lib/fa/download';
import FaUpload from 'react-icons/lib/fa/upload';
import FaPaperPlaneO from 'react-icons/lib/fa/paper-plane-o';
import FaTrash from 'react-icons/lib/fa/trash';
import FaFolder from 'react-icons/lib/fa/folder';

import QuestionTemplateModal from '../shared/modals/QuestionTemplate';

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
    this.state = {
      showModal: false,
    };
    this.toggleModal = this.toggleModal.bind(this);
  }

  toggleModal() {
    this.setState(prevState => ({ showModal: !prevState.showModal }));
  }

  render() {
    const {
      onDropFile, onDownloadQuestion, onResetQuestion,
      onSubmitQuestion, graphValidationState, questionList, onQuestionTemplate,
      concepts,
    } = this.props;
    const buttonStyles = { padding: '5px', marginLeft: '10px' };
    const isValidQuestion = graphValidationState.isValid;
    const errorMsg = 'Error: '.concat(graphValidationState.errorList.join(',\n '));
    return (
      <div style={{ position: 'relative', float: 'right', margin: '20px 0px' }}>
        <button
          onClick={this.toggleModal}
          className="btn btn-default"
          style={buttonStyles}
        >
          <span>
            Question Templates <span style={{ fontSize: '22px' }}><FaFolder style={{ cursor: 'pointer' }} /></span>
          </span>
        </button>
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
        <QuestionTemplateModal
          showModal={this.state.showModal}
          toggleModal={this.toggleModal}
          questions={questionList}
          selectQuestion={onQuestionTemplate}
          concepts={concepts}
        />
      </div>
    );
  }
}

export default NewQuestionButtons;
