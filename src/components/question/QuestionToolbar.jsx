import React from 'react';

import { ButtonGroup, Button } from 'react-bootstrap';

class QuestionToolbar extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <ButtonGroup vertical>
        <Button onClick={this.props.callbackUpdate}>Update</Button>
        <Button onClick={this.props.callbackFork}>Fork</Button>
        {this.props.enableDelete &&
          <Button onClick={this.props.callbackDelete}>Delete</Button>
      }
      </ButtonGroup>
    );
  }
}
QuestionToolbar.defaultProps = {
  enableDelete: false,
  callbackUpdate: () => {},
  callbackFork: () => {},
  callbackDelete: () => {},
};


export default QuestionToolbar;
