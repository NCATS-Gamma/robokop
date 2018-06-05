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
      <Navbar style={this.appConfig.styles.header}>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="/">Robokop</a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav>
            <NavItem eventKey={1} href={this.appConfig.urls.questions}>
              Questions
            </NavItem>
            {showNewQuestion &&
            <NavItem eventKey={2} href={this.appConfig.urls.questionDesign}>
              New Question
            </NavItem>
            }
            {hasStatus &&
              <Navbar.Text>
                {data.status}
              </Navbar.Text>
            }
          </Nav>
          <Nav pullRight>
            {showApps &&
            <NavDropdown eventKey={3} title="Apps" id="basic-nav-dropdown">
              <MenuItem eventKey={3.1} href={this.appConfig.urls.appAnswerset}>Answer Set Explorer</MenuItem>
              <MenuItem eventKey={3.2} href={this.appConfig.urls.appComparison}>Reasoner Comparison</MenuItem>
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
