import React from 'react';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';

import appConfig from '../appConfig'

class Header extends React.Component {
  constructor(props) {
      super(props);

      // We only read the communications config on instantiation
      this.appConfig = new appConfig(props.config);
  }

  getPropsData() {
    return {user: this.appConfig.ensureUser(this.props.user), status: this.props.status}
  }

  getNotLoggedInFrag() {
    return (
      <NavItem eventKey={3} href="/login">
        Login
      </NavItem>
    )
  }
  getLoggedInFrag(user) {
    return (
      <NavDropdown eventKey={3} title={user.username} id="basic-nav-dropdown">
        <MenuItem eventKey={3.1} href='/account'>Account</MenuItem>
        <MenuItem divider />
        <MenuItem eventKey={3.2} href='/logout'>Log Out</MenuItem>
      </NavDropdown>
    )
  }

  render() {
    const data = this.getPropsData();
    
    const isAuth = data.user.is_authenticated;
    const hasStatus = data.status ? true : false;

    return (
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="/">Robokop</a>
          </Navbar.Brand>
        </Navbar.Header>
        <Nav>
          <NavItem eventKey={1} href="/questions">
            Questions
          </NavItem>
          <NavItem eventKey={2} href="/new">
            New Question
          </NavItem>
          {hasStatus && 
            <Navbar.Text>
              {data.status}
            </Navbar.Text>
          }
        </Nav>
        <Nav pullRight>
          {isAuth &&
            this.getLoggedInFrag(data.user)
          }
          {!isAuth &&
            this.getNotLoggedInFrag()
          }
        </Nav>
      </Navbar>
    );
  }
}

export default Header;
