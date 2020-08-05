import React from 'react';

import {
  Navbar, Nav, NavItem, NavDropdown, MenuItem,
} from 'react-bootstrap';

import './header.css';

import config from '../../config.json';

export default function Header(props) {
  const { user } = props;

  const isAuth = user.is_authenticated;
  const showNewQuestion = isAuth && config.settings.enableNewQuestions;

  return (
    <Navbar
      style={{
        backgroundColor: config.colors.bluegray,
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
          <NavItem href={config.routes.questions}>
            Question Library
          </NavItem>
          {showNewQuestion && (
            <NavItem href={config.routes.questionDesign}>
              Ask a Question
            </NavItem>
          )}
        </Nav>
        <Nav pullRight>
          <NavItem href={config.routes.about}>
            About
          </NavItem>
          <NavItem href={config.routes.help}>
            Help
          </NavItem>
          <NavItem href={config.routes.guide}>
            Guide
          </NavItem>
          {isAuth ? (
            <NavDropdown title={user.username} id="basic-nav-dropdown">
              <MenuItem href={config.routes.logout}>Sign Out</MenuItem>
            </NavDropdown>
          ) : (
            <NavItem href={config.routes.login}>
              Sign In / Register
            </NavItem>
          )}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}
