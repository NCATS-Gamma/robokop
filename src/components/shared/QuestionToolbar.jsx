import React from 'react';

import { DropdownButton, MenuItem } from 'react-bootstrap';

import GoGear from 'react-icons/lib/go/gear';
import GoSync from 'react-icons/lib/go/sync';
import GoPlaybackPlay from 'react-icons/lib/go/playback-play';
import GoRepoForked from 'react-icons/lib/go/repo-forked';
import GoTrashcan from 'react-icons/lib/go/trashcan';

const shortid = require('shortid');

class QuestionToolbar extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    const refreshing = this.props.refreshActive || this.props.refreshQueued;
    const answering =  this.props.answerActive || this.props.answerQueued;

    return (
      <DropdownButton
        bsStyle="default"
        title={<GoGear />}
        key={shortid.generate()}
        id={`question-toolbar`}
        pullRight
        style={{padding: '3px 6px 3px 6px', marginRight: '15px'}}
      >
        <MenuItem
          eventKey="1"
          disabled={!this.props.enableQuestionRefresh}
          onSelect={this.props.callbackRefresh}
        >
          <GoSync /> Update Knowledge Graph
        </MenuItem>
        <MenuItem
          eventKey="2"
          disabled={!this.props.enableNewAnswersets}
          onSelect={this.props.callbackNewAnswerset}
        >
          <GoPlaybackPlay /> Find New Answers
        </MenuItem>
        <MenuItem
          eventKey="3"
          disabled={!this.props.enableQuestionFork}
          onSelect={this.props.callbackFork}
        >
          <GoRepoForked /> Fork Question
        </MenuItem>
        <MenuItem divider />
        <MenuItem
          eventKey="4"
          disabled={!this.props.enableQuestionDelete}
          onSelect={this.props.callbackRefresh}
        >
          <GoTrashcan /> Delete
        </MenuItem>
      </DropdownButton>
    );
  }
}


QuestionToolbar.defaultProps = {
  showFork: true,
  showRefresh: true,
  showNewAnswerset: true,
  showDelete: false,
  callbackFork: () => {},
  callbackUpdate: () => {},
  callbackNewAnswerset: () => {},
  callbackDelete: () => {},
};


export default QuestionToolbar;
