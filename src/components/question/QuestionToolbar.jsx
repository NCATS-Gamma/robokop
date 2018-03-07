import React from 'react';

import { ButtonToolbar, ButtonGroup, Button } from 'react-bootstrap';

class QuestionToolbar extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <ButtonToolbar>
        <ButtonGroup>
          <Button onClick={this.props.callbackFork}>Fork Question</Button>
          <Button onClick={this.props.callbackUpdate}>Update KG and Get New Answer Set</Button>
          <Button onClick={this.props.callbackNewAnswerset}>Get New Answer Set</Button>
          {this.props.enableDelete &&
            <Button onClick={this.props.callbackDelete}>Delete Question</Button>
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
