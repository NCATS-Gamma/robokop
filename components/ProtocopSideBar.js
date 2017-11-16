'use babel';

import React from 'react';
import { Panel, Media, Glyphicon, ButtonToolbar, Button, Accordion } from 'react-bootstrap';

const shortid = require('shortid');

class ProtocopSideBar extends React.Component {
  constructor(props) {
    super(props);

    this.getBoardPanel = this.getBoardPanel.bind(this);
    this.styles = {
      top: {
        marginLeft: 10,
        marginRight: 10,
      },
      list: {
        marginLeft: 10,
        marginRight: 10,
      },
      button: {
        marginTop: 10,
        textAlign: 'center',
      },
    };
  }

  getBoardPanel(board) {
    const id = shortid.generate();
    return (
      <Panel header={board.name} key={id} eventKey={id}>
        <Media>
          <Media.Left>
            <Button bsStyle="default" bsSize="sm" onClick={() => this.props.callbackLoadBoard(board)}>
              <Glyphicon glyph="folder-open" />
            </Button>
          </Media.Left>
          <Media.Body>
            {board.description}
          </Media.Body>
        </Media>
      </Panel>
    );
  }

  render() {
    let boards = this.props.boards;
    if (boards == null) {
      boards = [];
    }
    const noBoards = boards.length === 0;

    const boardsFragment = [];
    boards.forEach(b => boardsFragment.push(this.getBoardPanel(b)));

    return (
      <nav id="sidebar">
        <div className="row" style={this.styles.top}>
          <h2>PROTOCOP </h2>
        </div>
        <div className="row" style={this.styles.top}>
          <ButtonToolbar>
            <Button bsStyle="default" bsSize="lg" onClick={this.props.callbacks.collectionNew}>
              New Blackboard Collection
              <br />
              <Glyphicon glyph="duplicate" />
            </Button>
            <Button bsStyle="default" bsSize="lg" onClick={this.props.callbacks.collectionLoad}>
              Open Blackboard Collection
              <br />
              <Glyphicon glyph="briefcase" />
            </Button>
            <Button bsStyle="default" bsSize="lg" onClick={this.props.callbacks.blackboardNewUi}>
              New Blackboard
              <br />
              <Glyphicon glyph="file" />
            </Button>
          </ButtonToolbar>
        </div>
        
        {!noBoards &&
        <div className="row" style={this.styles.list}>  
          <h3> Your Blackboards </h3>
          <Accordion>
            {boardsFragment}
          </Accordion>
        </div>
        }
        {noBoards &&
        <div className="row" style={this.styles.list}>
          <h3> You don't yet have any blackboards </h3>
          <Button bsStyle="default" bsSize="lg" onClick={this.props.callbacks.blackboardNewUi}>
            Create a new Blackboard
          </Button>
        </div>
        }
      </nav>
    );
  }
}

export default ProtocopSideBar;
