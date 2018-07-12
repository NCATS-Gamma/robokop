import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col, Button } from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import WorkflowPres from './components/workflow/WorkflowPres';

class Workflow extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      conceptsReady: false,
      user: {},
      concepts: [],
      isValid: false,
    };

    this.dialogMessage = this.dialogMessage.bind(this);
    this.dialogConfirm = this.dialogConfirm.bind(this);
  }

  componentDidMount() {
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
    this.appConfig.concepts((data) => {
      this.setState({
        concepts: data,
        conceptsReady: true,
        isValid: true,
      });
    });
    this.setState({ dataReady: true });
  }


  dialogConfirm(callbackToDo, inputOptions) {
    const defaultOptions = {
      confirmationTitle: 'Confirmation Required',
      confirmationText: 'Are you sure?',
      confirmationButtonText: 'OK',
    };
    const options = { ...defaultOptions, ...inputOptions };

    // Show custom react-bootstrap-dialog
    this.dialog.show({
      title: options.confirmationTitle,
      body: options.confirmationText,
      actions: [
        Dialog.CancelAction(() => {}),
        Dialog.Action(
          options.confirmationButtonText,
          () => callbackToDo(),
          'btn-primary',
        ),
      ],
      bsSize: 'large',
      onHide: (dialog) => {
        dialog.hide();
        // console.log('closed by clicking background.')
      },
    });
  }
  dialogWait(inputOptions) {
    const defaultOptions = {
      title: 'Hi',
      text: 'Please wait...',
      showLoading: false,
    };
    const options = { ...defaultOptions, ...inputOptions };

    const bodyNode = (
      <div>
        {options.text}
        {options.showLoading &&
          <Loading />
        }
      </div>
    );

    // Show custom react-bootstrap-dialog
    this.dialog.show({
      title: options.title,
      body: bodyNode,
      actions: [],
      bsSize: 'large',
      onHide: () => {},
    });
  }
  dialogMessage(inputOptions) {
    const defaultOptions = {
      title: 'Hi',
      text: 'How are you?',
      buttonText: 'OK',
      buttonAction: () => {},
    };
    const options = { ...defaultOptions, ...inputOptions };

    // Show custom react-bootstrap-dialog
    this.dialog.show({
      title: options.title,
      body: options.text,
      actions: [
        Dialog.Action(
          options.buttonText,
          (dialog) => { dialog.hide(); options.buttonAction(); },
          'btn-primary',
        ),
      ],
      bsSize: 'large',
      onHide: (dialog) => {
        dialog.hide();
      },
    });
  }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderInvalid() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <h3>
              Invalid Data!
            </h3>
            <p>
              {"We're sorry but we can't make sense of the data we got from the server."}
            </p>
          </Col>
        </Row>
      </Grid>
    );
  }
  renderLoaded() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        {this.state.isValid &&
          <WorkflowPres
            config={this.appConfig}
            concepts={this.state.concepts}
            initWorkflow={[{}]}
          />
        }
        {!this.state.isValid &&
          this.renderInvalid()
        }
        <Footer config={this.props.config} />
        <Dialog ref={(el) => { this.dialog = el; }} />
      </div>
    );
  }
  render() {
    const ready = this.state.userReady && this.state.conceptsReady && this.state.dataReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

Workflow.propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }).isRequired,
};

export default Workflow;
