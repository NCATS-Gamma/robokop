import React from 'react';

import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';

import AppConfig from '../AppConfig';

class Header extends React.Component {
  constructor(props) {
    super(props);

    // We only read the communications config on instantiation
    this.appConfig = new AppConfig(props.config);
  }

  getPropsData() {
    return { user: this.appConfig.ensureUser(this.props.user), status: this.props.status };
  }

  getNotLoggedInFrag() {
    return (
      <NavItem href={this.appConfig.urls.login}>
        {'Sign In / Register'}
      </NavItem>
    );
  }
  getLoggedInFrag(user) {
    return (
      <NavDropdown title={user.username} id="basic-nav-dropdown">
        <MenuItem href={this.appConfig.urls.logout}>Sign Out</MenuItem>
      </NavDropdown>
    );
  }

  render() {
    const { user, status } = this.getPropsData();

    const isAuth = user.is_authenticated;
    const showNewQuestion = isAuth && this.appConfig.enableNewQuestions;
    const hasStatus = status && status.length > 0;

    return (
      <Navbar
        style={{
          backgroundColor: this.appConfig.colors.bluegray,
          boxShadow: '0px 0px 5px 0px #b3b3b3',
          // backgroundImage: `linear-gradient(315deg, ${this.appConfig.colors.blue} 0%, ${this.appConfig.colors.bluegray} 74%)`,
        }}
        staticTop
      >
        <Navbar.Header>
          <Navbar.Brand>
            <a href="/">Robokop</a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav>
            <NavItem href={this.appConfig.urls.questions}>
              Question Library
            </NavItem>
            {showNewQuestion &&
            <NavItem href={this.appConfig.urls.questionDesign}>
              Ask a Question
            </NavItem>
            }
            {hasStatus &&
              <Navbar.Text>
                {status}
              </Navbar.Text>
            }
          </Nav>
          <Nav pullRight>
            <NavItem href={this.appConfig.urls.about}>
              About
            </NavItem>
            <NavItem href={this.appConfig.urls.help}>
              Help
            </NavItem>
            <NavItem href={this.appConfig.urls.guide}>
              Guide
            </NavItem>
            {isAuth ?
              this.getLoggedInFrag(user)
            :
              this.getNotLoggedInFrag()
            }
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

Header.defaultProps = {
  status: '',
};

export default Header;
