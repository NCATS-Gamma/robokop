import React from 'react';

import { ButtonToolbar, ButtonGroup, Button } from 'react-bootstrap';

import GoRepoForked from 'react-icons/lib/go/repo-forked';
import GoSync from 'react-icons/lib/go/sync';
import GoPlaybackPlay from 'react-icons/lib/go/playback-play';
import GoTrashcan from 'react-icons/lib/go/trashcan';

class QuestionToolbar extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <ButtonToolbar>
        <ButtonGroup>
          <Button title="Fork Question" onClick={this.props.callbackFork}><GoRepoForked /></Button>
          <Button title="Update KG and Get New Answer Set" onClick={this.props.callbackUpdate}><GoSync /></Button>
          <Button title="Get New Answer Set" onClick={this.props.callbackNewAnswerset}><GoPlaybackPlay /></Button>
          {this.props.enableDelete &&
            <Button title="Delete Question" onClick={this.props.callbackDelete}><GoTrashcan /></Button>
        }
        </ButtonGroup>
      </ButtonToolbar>
    );
  }
}
QuestionToolbar.defaultProps = {
  enableDelete: false,
  callbackFork: () => {},
  callbackUpdate: () => {},
  callbackNewAnswerset: () => {},
  callbackDelete: () => {},
};


export default QuestionToolbar;
