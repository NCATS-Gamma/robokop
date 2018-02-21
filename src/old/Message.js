'use babel';

import React from 'react';
import { Button, ButtonToolbar, ProgressBar } from 'react-bootstrap';

const shortid = require('shortid');

class Message extends React.Component {
  constructor(props) {
    super(props);
    // visible = app.state.visible
    // title = app.state.message_text
    // text = app.state.message_title
    // showButton = app.state.message_showButton
    // buttonText = app.state.message_buttonText
    // buttonCallback = function
    // showProgress = app.state.message_showProgress
  }
  render() {
    let buttonFragment = [];
    if (this.props.showButton) {
      if (Array.isArray(this.props.buttonCallback) && Array.isArray(this.props.buttonText)) {
        // Array mode
        const buttonsFragment = [];
        for (let iButton = 0; iButton < this.props.buttonCallback.length; iButton += 1) {
          buttonsFragment.push(
            <Button key={shortid.generate()} bsStyle={'primary'} bsSize={'large'} onClick={this.props.buttonCallback[iButton]}>
              {this.props.buttonText[iButton]}
            </Button>,
          );
        }

        buttonFragment = [
          <ButtonToolbar key={shortid.generate()}>
            {buttonsFragment}
          </ButtonToolbar>,
        ];
      } else {
        buttonFragment = [
          <ButtonToolbar key={shortid.generate()}>
            <Button bsStyle={'primary'} bsSize={'large'} onClick={this.props.buttonCallback}>
              {this.props.buttonText}
            </Button>
          </ButtonToolbar>,
        ];
      }
    }
    let progressFragment = [];
    if (this.props.showProgress) {
      progressFragment = (
        <ProgressBar key={shortid.generate()} active now={100} />
      );
    }
    let hidden = 'hidden';
    if (this.props.visible) {
      hidden = '';
    }
    return (
      <div id="Message" className={`jumbotron vertical-center ${hidden}`}>
        <div className="container">
          <h1>{this.props.title}</h1>
          <p>{this.props.text}</p>
          {buttonFragment}
          {progressFragment}
        </div>
      </div>
    );
  }
}

export default Message;
