import React, { Component } from 'react';
import AppConfig from '../../AppConfig';
import Dialog from 'react-bootstrap-dialog';
import { Tabs, Tab, Panel } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import Loading from '../Loading';
// const _ = require('lodash');

class TasksModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      question: {},
      managerLogs: '',
      rankerLogs: '',
      showLogs: false,
      selectedLog: 'manager',
      activeTask: 0
    };

    this.styles = {
      list: {
        width: '20%',
        display: 'inline-block',
        textAlign: 'center'
      }
    };

    // We only read the communications config on instantiation
    this.appConfig = new AppConfig(props.config);
    this.dialogConfirm = this.dialogConfirm.bind(this);
    this.dialogMessage = this.dialogMessage.bind(this);
    this.dialogWait = this.dialogWait.bind(this);
    this.setQuestion = this.setQuestion.bind(this);
    this.renderTasks = this.renderTasks.bind(this);
    this.getTaskLogs = this.getTaskLogs.bind(this);
    this.showModal = this.showModal.bind(this);
    this.selectLogTab = this.selectLogTab.bind(this);
    this.hideLogs = this.hideLogs.bind(this);
  }

  componentDidMount() {
    this.setQuestion();
  }

  // shouldComponentUpdate({}, newState) {
  //   const propsAllMatch = true;
  //   const stateAllMatch = (newState.activeTask === this.state.activeTask);
  //   return !(propsAllMatch && stateAllMatch);
  // }

  setQuestion() {
    this.setState({ question: this.props.question }, () => {
      this.getTaskLogs(this.state.question.tasks[0].id, 0);
    });
  }

  selectLogTab(tab) {
    this.setState({ selectedLog: tab }, () => {
      this.showModal();
    });
  }

  hideLogs() {
    this.setState({ showLogs: false }, () => {
      this.showModal();
    });
  }

  renderTasks({
    index,
    key,
    style
  }) {
    const task = this.state.question.tasks[index];
    const taskType = task.type.split('.').slice(-1)[0];
    const initialTime = task.timestamp && new Date(task.timestamp).toLocaleString();
    const startTime = task.startingTimestamp && new Date(task.startingTimestamp).toLocaleString();
    const endTime = task.endTimestamp && new Date(task.endTimestamp).toLocaleString();
    const result = JSON.parse(task.result).status;
    return (
      <div key={key} className={`taskListTask${this.state.activeTask === index ? ' active' : ''}`} style={style} onClick={() => this.getTaskLogs(task.id, index)}>
        <div className='taskListItem'>{taskType || 'N/A'}</div>
        <div className='taskListItem'>{initialTime || 'N/A'}</div>
        <div className='taskListItem'>{startTime || 'N/A'}</div>
        <div className='taskListItem'>{endTime || 'N/A'}</div>
        <div className='taskListItem'>{result || 'N/A'}</div>
      </div>
    );
  }

  getTaskLogs(taskId, index) {
    this.appConfig.taskLog(
      taskId,
      (logs) => {
        console.log('get logs back');
        this.setState({ managerLogs: JSON.stringify(logs.task_log), rankerLogs: JSON.stringify(logs.remote_task_log), showLogs: true, activeTask: index }, () => {
          this.showModal();
        });
      }
    )
  }

  showModal() {
    const { question, activeTask } = this.state;
    // this.getTaskLogs(question.tasks[activeTask].id, activeTask);
    const isAuth = this.props.user.is_admin || this.props.user.user_id === question.initiator;
    const rowCount = question.tasks.length;
    const listHeight = Math.max(Math.min((rowCount * 50), 200), 100);
    const taskList =
      <AutoSizer disableHeight defaultWidth={100}>
        {({ width }) => (
          <List
            height={listHeight}
            width={width}
            rowCount={rowCount}
            rowHeight={50}
            rowRenderer={this.renderTasks}
          />
        )}
      </AutoSizer>;

    const modalContent = (
      <div>
        <h3 style={this.styles.list}>Task Type</h3>
        <h3 style={this.styles.list}>Initialized</h3>
        <h3 style={this.styles.list}>Start Time</h3>
        <h3 style={this.styles.list}>End Time</h3>
        <h3 style={this.styles.list}>Result</h3>
        {taskList}
        {this.state.showLogs &&
          <Panel>
            <Panel.Heading>
              <Panel.Title>
                <h3 style={{ textAlign: 'center' }}>Task Logs</h3>
                <button className='logButton' onClick={this.hideLogs}>
                  <span>
                    X
                  </span>
                </button>
                <button className='logButton' onClick={() => { this.getTaskLogs(question.tasks[activeTask].id, activeTask) }}>
                  <span>
                    Refresh
                  </span>
                </button>
              </Panel.Title>
            </Panel.Heading>
            <Panel.Body>
              <Tabs
                activeKey={this.state.selectedLog}
                onSelect={this.selectLogTab}
                animation
                id='taskLogs'
                mountOnEnter
              >
                <Tab
                  eventKey='manager'
                  title='Manager Logs'
                >
                  <div style={{ height: 250, overflow: 'scroll' }}>
                    {this.state.managerLogs.substring(1, this.state.managerLogs.length - 1).split('\\n').map((log, index) => {
                      const logDelimiter = log.indexOf(']') + 1;
                      return <div key={`manager-${index}`}><b>{log.substring(0, logDelimiter)}</b>{log.substring(logDelimiter)}</div>
                    })}
                  </div>
                </Tab>
                <Tab
                  eventKey='ranker'
                  title='Ranker Logs'
                >
                  <div style={{ height: 250, overflow: 'scroll' }}>
                    {this.state.rankerLogs.substring(1, this.state.rankerLogs.length - 1).split('\\n').map((log, index) => {
                      const logDelimiter = log.indexOf(']') + 1;
                      return <div key={`ranker-${index}`}><b>{log.substring(0, logDelimiter)}</b>{log.substring(logDelimiter)}</div>
                    })}
                  </div>
                </Tab>
              </Tabs>
            </Panel.Body>
          </Panel>
        }
      </div>
    );

    if (question.isBusy && isAuth) {
      const contentTitle = `Stop Task ${question.id}?`;
      const content = (
        <div>
          {modalContent}
          <h3>
            You can stop this task prior to completion. Are you sure you want to stop this task?
          </h3>
        </div>
      );

      this.dialogConfirm(
        () => {
          this.dialogWait({
            title: 'Stopping Task...',
            text: '',
            showLoading: true,
          });

          // Actually try to delete the question here.
          this.appConfig.taskStop(
            task.id,
            () => {
              this.notificationSystem.addNotification({
                title: 'Task Stopped',
                message: `Task ${task.id} for question ${task.questionId} successfully stopped.`,
                level: 'info',
                position: 'tr',
                dismissible: 'click',
              });
              this.dialog.hide();
              this.refreshTasks();
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
          buttonAction: () => { this.props.closeModal(); }
        },
      );
    } else {
      const content = modalContent;
      this.dialogMessage({
        title: question.naturalQuestion,
        text: content,
        buttonText: 'OK',
        buttonAction: () => { this.props.closeModal() },
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
        Dialog.CancelAction(() => { options.buttonAction() }),
        Dialog.Action(
          options.confirmationButtonText,
          () => callbackToDo(),
          'btn-primary',
        ),
      ],
      bsSize: 'large',
      onHide: (dialog) => {
        dialog.hide();
        options.buttonAction();
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
      onHide: () => { options.buttonAction(); },
    });
  }
  dialogMessage(inputOptions) {
    const defaultOptions = {
      title: 'Hi',
      text: 'How are you?',
      buttonText: 'OK',
      buttonAction: () => { },
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
        options.buttonAction();
      },
    });
  }

  render() {
    return <Dialog ref={(el) => { this.dialog = el; }} />;
  }
}

export default TasksModal;