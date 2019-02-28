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
      <NavItem eventKey={4} href={this.appConfig.urls.login}>
        {'Log In'}
      </NavItem>
    );
  }
  getLoggedInFrag(user) {
    return (
      <NavDropdown eventKey={4} title={user.username} id="basic-nav-dropdown">
        <MenuItem eventKey={4.1} href={this.appConfig.urls.logout}>Log Out</MenuItem>
      </NavDropdown>
    );
  }

  render() {
    const data = this.getPropsData();

    const isAuth = data.user.is_authenticated;
    const showNewQuestion = isAuth && this.appConfig.enableNewQuestions;
    const hasStatus = data.status && data.status.length > 0;
    const showApps = true;

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
            <NavItem eventKey={1} href={this.appConfig.urls.questions}>
              Question Library
            </NavItem>
            {showNewQuestion &&
            <NavItem eventKey={2} href={this.appConfig.urls.questionDesign}>
              Ask a Question
            </NavItem>
            }
            {hasStatus &&
              <Navbar.Text>
                {data.status}
              </Navbar.Text>
            }
          </Nav>
          <Nav pullRight>
            <NavItem eventKey={0} href={this.appConfig.urls.about}>
              About
            </NavItem>
            {showApps &&
            <NavDropdown eventKey={3} title="Apps" id="basic-nav-dropdown">
              <MenuItem eventKey={3.1} href={this.appConfig.urls.search}>Search - <small>Find Identifiers for Biomedical Concepts</small></MenuItem>
              <MenuItem eventKey={3.2} href={this.appConfig.urls.view}>Answer Set Explorer - <small>Use the Robokop UI with answer set files.</small></MenuItem>
            </NavDropdown>
            }
            {isAuth &&
              this.getLoggedInFrag(data.user)
            }
            {!isAuth &&
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
