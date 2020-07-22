import React, { Component } from 'react';
import { Panel, Modal } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import AppConfig from '../../../AppConfig';
import TaskLogs from './TaskLogs';
import { config } from '../../../index';

import './modals.css';

const _ = require('lodash');

const timestampToDate = (ts) => {
  let ts2 = ts;
  if (ts) {
    if (!ts.endsWith('Z')) {
      ts2 = `${ts}Z`;
    }
    return new Date(ts2);
  }
  return null;
};

class TasksModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      logType: '',
      managerLogs: '',
      rankerLogs: '',
      showLogs: false,
      activeTask: 0,
    };

    this.styles = {
      list: {
        width: '20%',
        display: 'inline-block',
        textAlign: 'center',
      },
    };

    // We only read the communications config on instantiation
    this.appConfig = new AppConfig(config);
    this.renderTasks = this.renderTasks.bind(this);
    this.getTaskLogs = this.getTaskLogs.bind(this);
    this.hideLogs = this.hideLogs.bind(this);
  }

  componentDidUpdate(prevProps) {
    // if the question changes or the modal is opened up, get the task logs
    if (!_.isEqual(prevProps.tasks, this.props.tasks) || ((prevProps.showModal !== this.props.showModal) && this.props.showModal)) {
      if (this.props.tasks) {
        this.getTaskLogs(this.props.tasks[0].id, 0);
      } else if (this.props.task) {
        this.getTaskLogs(this.props.task.id, 0);
      }
    }
  }

  hideLogs() {
    this.setState({ showLogs: false });
  }

  getTaskLogs(taskId, index) {
    this.appConfig.taskLog(
      taskId,
      (logs) => {
        this.setState({
          logType: logs.task_type,
          managerLogs: JSON.stringify(logs.task_log),
          rankerLogs: JSON.stringify(logs.remote_task_log),
          showLogs: true,
          activeTask: index,
        });
      },
    );
  }

  renderTasks({
    index,
    key,
    style,
  }) {
    const task = this.props.tasks[index];
    let taskType = task.type;
    if (taskType.endsWith('update_kg')) {
      taskType = 'Refresh';
    } else if (taskType.endsWith('answer_question')) {
      taskType = 'Answer';
    } else {
      taskType = '?';
    }
    const initialTime = task.timestamp && timestampToDate(task.timestamp).toLocaleString();
    const startTime = task.startingTimestamp && timestampToDate(task.startingTimestamp).toLocaleString();
    const endTime = task.endTimestamp && timestampToDate(task.endTimestamp).toLocaleString();
    const taskResult = JSON.parse(task.result);
    const result = taskResult.status;
    return (
      <button key={key} className={`taskListTask${this.state.activeTask === index ? ' active' : ''}`} style={style} onClick={() => this.getTaskLogs(task.id, index)}>
        <div className="taskListItem">{taskType || 'N/A'}</div>
        <div className="taskListItem">{initialTime || 'N/A'}</div>
        <div className="taskListItem">{startTime || 'N/A'}</div>
        <div className="taskListItem">{endTime || 'N/A'}</div>
        <div className="taskListItem">{result || 'N/A'}</div>
      </button>
    );
  }

  // TODO: This is fragmented logic that should be included back in once stopTask functionality is restored

  // if (question.isBusy && isAuth) {
  //   const contentTitle = `Stop Task ${question.id}?`;
  //   const content = (
  //     <div>
  //       {modalContent}
  //       <h3>
  //         You can stop this task prior to completion. Are you sure you want to stop this task?
  //       </h3>
  //     </div>
  //   );
  // }

  //   this.dialogConfirm(
  //     () => {
  //       this.dialogWait({
  //         title: 'Stopping Task...',
  //         text: '',
  //         showLoading: true,
  //       });

  //       // Actually try to delete the question here.
  //       this.appConfig.taskStop(
  //         task.id,
  //         () => {
  //           this.notificationSystem.addNotification({
  //             title: 'Task Stopped',
  //             message: `Task ${task.id} for question ${task.questionId} successfully stopped.`,
  //             level: 'info',
  //             position: 'tr',
  //             dismissible: 'click',
  //           });
  //           this.dialog.hide();
  //           this.refreshTasks();
  //         },
  //         (err) => {
  //           console.log(err);
  //           this.dialogMessage({
  //             title: 'Task Not Stopped!',
  //             text: `We were unable to stop task ${task.id}. This could due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.`,
  //             buttonText: 'OK',
  //           });
  //         },
  //       );
  //     },
  //     {
  //       confirmationTitle: contentTitle,
  //       confirmationText: content,
  //       confirmationButtonText: 'Stop',
  //       buttonAction: () => { this.props.closeModal(); }
  //     },
  //   );
  // } else {
  //   const content = modalContent;
  //   this.dialogMessage({
  //     title: question.naturalQuestion,
  //     text: content,
  //     buttonText: 'OK',
  //     buttonAction: () => { this.props.closeModal() },
  //   });
  // }
  // }

  render() {
    const {
      activeTask, managerLogs, rankerLogs, logType,
    } = this.state;
    const {
      header, showModal, toggleModal, task, tasks,
    } = this.props;
    const rowCount = (tasks && tasks.length) || 0;
    const listHeight = Math.max(Math.min((rowCount * 50), 200), 100);
    return (
      <Modal
        show={showModal}
        onHide={toggleModal}
        backdrop
      >
        {header &&
          <Modal.Header closeButton>
            <Modal.Title>
              {header}
            </Modal.Title>
          </Modal.Header>
        }
        <Modal.Body>
          {tasks &&
            <div>
              <h3 style={this.styles.list}>Task Type</h3>
              <h3 style={this.styles.list}>Initialized</h3>
              <h3 style={this.styles.list}>Start Time</h3>
              <h3 style={this.styles.list}>End Time</h3>
              <h3 style={this.styles.list}>Result</h3>
              <AutoSizer disableHeight defaultWidth={100}>
                {({ width }) => (
                  <List
                    height={listHeight}
                    width={width}
                    rowCount={rowCount}
                    rowHeight={50}
                    rowRenderer={this.renderTasks}
                    activeTask={activeTask}
                    tasks={tasks}
                  />
                )}
              </AutoSizer>
            </div>
          }
          {this.state.showLogs &&
            <Panel>
              <Panel.Heading>
                <Panel.Title>
                  <h3 style={{ textAlign: 'center' }}>Task Logs</h3>
                  {tasks &&
                    <button className="logButton" onClick={this.hideLogs}>
                      <span>
                        X
                      </span>
                    </button>
                  }
                  <button className="logButton" onClick={() => { this.getTaskLogs((tasks && tasks[activeTask].id) || task.id, activeTask); }}>
                    <span>
                      Refresh
                    </span>
                  </button>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <TaskLogs managerLogs={managerLogs} rankerLogs={rankerLogs} logType={logType} />
              </Panel.Body>
            </Panel>
          }
        </Modal.Body>
        <Modal.Footer>
          <button onClick={toggleModal}>Close</button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default TasksModal;
