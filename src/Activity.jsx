import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col } from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import NotificationSystem from 'react-notification-system';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import ActivityPres from './components/activity/ActivityPres';

class Activity extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      user: {},
      tasks: [],
    };

    this.callbackTaskStop = this.callbackTaskStop.bind(this);

    this.dialogWait = this.dialogWait.bind(this);
    this.dialogMessage = this.dialogMessage.bind(this);
    this.dialogConfirm = this.dialogConfirm.bind(this);
  }

  componentDidMount() {
    this.appConfig.tasksData(data => this.setState({
      tasks: data,
      dataReady: true,
    }));
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
  }
  callbackTaskStop(task) {

    const isBusy = !(task.status === 'FAILURE' || task.status === 'SUCCESS');
    const isAuth = this.state.user.isAdmin;

    let ts = task.timestamp;
    if (!ts.endsWith('Z')) {
      ts = `${ts}Z`;
    }
    const d = new Date(ts);
    const timeString = d.toLocaleString();

    let { status } = task;
    if (isBusy) {
      status = 'Active';
    }
    const taskSummary = (
      <ul>
        <li>{`ID: ${task.id}`}</li>
        <li>{`Question: ${task.question_id}`}</li>
        <li>{`Initiator: ${task.initiator}`}</li>
        <li>{`Started: ${timeString}`}</li>
        <li>{`Status: ${status}`}</li>
      </ul>
    );

    if (isBusy && isAuth) {
      const contentTitle = `Stop Task ${task.id}?`;
      const content = (
        <div>
          {taskSummary}
          <p>
            Are you sure you want to stop this task?
          </p>
        </div>
      );

      this.dialogConfirm(
        () => {
          this.dialogWait({
            title: 'Stoping Task...',
            text: '',
            showLoading: true,
          });

          // Actually try to delete the question here.
          this.appConfig.taskStop(
            task.id,
            () => {
              this.notificationSystem.addNotification({
                title: 'Task Stopped',
                message: `Task ${task.id} for question ${task.question_id} succesfully stopped.`,
                level: 'info',
                position: 'tr',
                dismissible: 'click',
              });
            },
            (err) => {
              console.log(err);
              this.dialogMessage({
                title: 'Task Not Stopped!',
                text: `We were unable to stop task ${task.id}. This could due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.`,
                buttonText: 'OK',
              });
            },
          );
        },
        {
          confirmationTitle: contentTitle,
          confirmationText: content,
          confirmationButtonText: 'Stop',
        },
      );
    } else {
      const content = (
        <div>
          {taskSummary}
        </div>
      );
      this.dialogMessage({
        title: `Task ${task.id}`,
        text: content,
        buttonText: 'OK',
        buttonAction: () => {},
      });
    }
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
  renderLoaded() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          <ActivityPres
            user={this.state.user}
            tasks={this.state.tasks}
            onClick={this.callbackTaskStop}
          />
        </Grid>
        <Footer config={this.props.config} />
        <Dialog ref={(el) => { this.dialog = el; }} />
        <NotificationSystem
          ref={(ref) => { this.notificationSystem = ref; }}
        />
      </div>
    );
  }
  render() {
    const ready = this.state.dataReady && this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

Activity.propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }).isRequired,
};

export default Activity;
