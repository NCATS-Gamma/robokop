import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import AccountCircle from '@material-ui/icons/AccountCircle';
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined';

import googleIcon from '../../../public/images/btn_google_light_normal_ios.svg';

import './header.css';

export default function Header(props) {
  const { user, setUser } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  function signInSuccess(googleUser) {
    const username = googleUser.getBasicProfile().Ad;
    const { id_token } = googleUser.getAuthResponse();
    setUser({ username, id_token });
  }

  function onSignIn() {
    setAnchorEl(null);
    const GoogleAuth = window.gapi.auth2.getAuthInstance();
    GoogleAuth.signIn({
      scope: 'profile email',
    })
      .then((googleUser) => {
        signInSuccess(googleUser);
      })
      .catch((err) => {
        console.log('Sign in error:', err.error);
      });
  }

  function signOut() {
    const GoogleAuth = window.gapi.auth2.getAuthInstance();
    GoogleAuth.signOut()
      .then(() => {
        setUser(null);
        // This disconnect closes the scope to the Robokop google credentials
        GoogleAuth.disconnect();
      });
  }

  function openSignIn(e) {
    setAnchorEl(e.currentTarget);
  }

  useEffect(() => {
    if (window.gapi && !user) {
      window.gapi.load('auth2', () => {
        let GoogleAuth = window.gapi.auth2.getAuthInstance();
        if (!GoogleAuth) {
          window.gapi.auth2.init({
            client_id: '297705140796-41v2ra13t7mm8uvu2dp554ov1btt80dg.apps.googleusercontent.com',
          })
            .then(() => {
              GoogleAuth = window.gapi.auth2.getAuthInstance();
              if (GoogleAuth.isSignedIn.get()) {
                signInSuccess(GoogleAuth.currentUser.get());
              }
            })
            .catch((err) => {
              console.log('error', err);
            });
        } else if (GoogleAuth.isSignedIn.get()) {
          onSignIn(GoogleAuth.currentUser.get());
        }
      });
    }
  }, []);

  return (
    <AppBar position="relative" className="header">
      <Toolbar id="headerToolbar">
        <Link to="/" id="robokopBrand">Robokop</Link>
        <Link to="/questions">Question Library</Link>
        {user ? (
          <Link to="/q/new">Ask a Question</Link>
        ) : (
          <Link to="/simple/question">Ask a Quick Question</Link>
        )}
        <div className="grow" />
        <Link to="/about">About</Link>
        <Link to="/help">Help</Link>
        <Link to="/guide">Guide</Link>
        <Divider orientation="vertical" variant="middle" flexItem />
        <IconButton
          onClick={openSignIn}
          fontSize="large"
        >
          {user ? (
            <AccountCircle id="signedInIcon" fontSize="large" />
          ) : (
            <AccountCircleOutlinedIcon fontSize="large" />
          )}
        </IconButton>
        <Popover
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {user ? (
            <Button onClick={signOut}>Sign Out</Button>
          ) : (
            <Button onClick={onSignIn} id="googleSignIn">
              <img src={googleIcon} alt="google icon" />
              <span>Sign in with Google</span>
            </Button>
          )}
        </Popover>
      </Toolbar>
    </AppBar>
  );
}
