'use babel';

import React from 'react';
import { Navbar, Nav, NavItem, Button, Glyphicon } from 'react-bootstrap';

class ProtocopBoardMenu extends React.Component {
  constructor(props) {
      super(props);
  }

  render() {
    const noBoard = this.props.board == null;
    let boardName = 'Open an existing or create a new blackboard';
    if (!noBoard) {
      boardName = this.props.board.name;
    }

    return (
      <Navbar>
        <Navbar.Collapse>
          <Navbar.Header>
            <Navbar.Form pullLeft>
              <Button className="btn" type="button" onClick={this.props.callbackToggleSidebar}>
                <Glyphicon glyph="menu-hamburger" />
              </Button>
            </Navbar.Form>
          </Navbar.Header>
          <Navbar.Brand>
            <a href="#" onClick={this.props.callbackBacktoList}>PROTOCOP</a>
          </Navbar.Brand>
          <Navbar.Text>
            <Navbar.Link href="#" onClick={this.props.callbackBacktoList}>Blackboards</Navbar.Link>
          </Navbar.Text>
          <Navbar.Text>
            <Navbar.Link href="#" onClick={this.props.callbacks.openExternalNeo4j}>Neo4j</Navbar.Link>
          </Navbar.Text>
          <Navbar.Text>
            <span className="header-val">{boardName}</span>
          </Navbar.Text>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

export default ProtocopBoardMenu;
