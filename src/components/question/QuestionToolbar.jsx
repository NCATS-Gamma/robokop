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
          {this.props.showFork &&
            <Button title="Fork Question" onClick={this.props.callbackFork}><GoRepoForked /></Button>
          }
          {this.props.showRefresh &&
            <Button title="Update KG and Get New Answer Set" onClick={this.props.callbackUpdate}><GoSync /></Button>
          }
          {this.props.showNewAnswerset &&
            <Button title="Get New Answer Set" onClick={this.props.callbackNewAnswerset}><GoPlaybackPlay /></Button>
          }
          {this.props.showDelete &&
            <Button title="Delete Question" onClick={this.props.callbackDelete}><GoTrashcan /></Button>
          }
        </ButtonGroup>
      </ButtonToolbar>
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
