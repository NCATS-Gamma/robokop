import React from 'react';

import { DropdownButton, MenuItem } from 'react-bootstrap';

import { GoGear, GoRepoForked, GoMilestone, GoTrashcan } from 'react-icons/go';
import { FaEye, FaCheck, FaPlay } from 'react-icons/fa';

const shortid = require('shortid');

class QuestionToolbar extends React.PureComponent {
  render() {
    const { visibility, isAdmin } = this.props;
    return (
      <DropdownButton
        bsStyle="default"
        title={<GoGear />}
        key={shortid.generate()}
        id="question-toolbar"
        pullRight
        style={{ padding: '3px 6px 3px 6px', marginRight: '15px' }}
      >
        {/* <MenuItem
          eventKey="1"
          disabled={!this.props.enableQuestionRefresh}
          onSelect={this.props.callbackRefresh}
        >
          <GoSync /> Update Knowledge Graph
        </MenuItem> */}
        <MenuItem
          eventKey="2"
          disabled={!this.props.enableNewAnswersets}
          onSelect={this.props.callbackNewAnswerset}
        >
          <FaPlay /> Find New Answers
        </MenuItem>
        <MenuItem
          eventKey="3"
          disabled={!this.props.enableQuestionFork}
          onSelect={this.props.callbackFork}
        >
          <GoRepoForked /> Ask a New Question Like this One
        </MenuItem>
        <MenuItem
          eventKey="4"
          onSelect={this.props.callbackTaskStatus}
        >
          <GoMilestone /> Tasks
        </MenuItem>
        <MenuItem divider />
        <MenuItem header><FaEye /> Question Visibility</MenuItem>
        <MenuItem
          eventKey="5"
          onSelect={() => this.props.callbackQuestionVisibility('private')}
        >
          {'Private '}
          {visibility === 'PRIVATE' && (
            <FaCheck />
          )}
        </MenuItem>
        <MenuItem
          eventKey="6"
          onSelect={() => this.props.callbackQuestionVisibility('public')}
        >
          {'Public '}
          {visibility === 'PUBLIC' && (
            <FaCheck />
          )}
        </MenuItem>
        {isAdmin && (
          <MenuItem
            eventKey="7"
            onSelect={() => this.props.callbackQuestionVisibility('promoted')}
          >
            {'Promoted '}
            {visibility === 'PROMOTED' && (
              <FaCheck />
            )}
          </MenuItem>
        )}
        <MenuItem divider />
        <MenuItem
          eventKey="8"
          disabled={!this.props.enableQuestionDelete}
          onSelect={this.props.callbackDelete}
        >
          <GoTrashcan /> Delete
        </MenuItem>
      </DropdownButton>
    );
  }
}

QuestionToolbar.defaultProps = {
  enableQuestionRefresh: true,
  enableNewAnswersets: false,
  enableQuestionFork: false,
  enableQuestionDelete: false,
  enableTaskStatus: false,
  callbackFork: () => {},
  callbackUpdate: () => {},
  callbackNewAnswerset: () => {},
  callbackDelete: () => {},
  callbackTaskStatus: () => {},
};


export default QuestionToolbar;
