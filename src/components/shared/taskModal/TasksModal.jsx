import React, { Component } from 'react';
import { Panel, Modal } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import AppConfig from '../../../AppConfig';
import TaskLogs from './TaskLogs';

const config = require('../../../../config.json');
const _ = require('lodash');

class TasksModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
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
    if (!_.isEqual(prevProps.question, this.props.question) || ((prevProps.showModal !== this.props.showModal) && this.props.showModal)) {
      if (this.props.question) {
        this.getTaskLogs(this.props.question.tasks[0].id, 0);
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
    const task = this.props.question.tasks[index];
    let taskType = task.type;
    if (taskType.endsWith('update_kg')) {
      taskType = 'Refresh';
    } else if (taskType.endsWith('answer_question')) {
      taskType = 'Answer';
    } else {
      taskType = '?';
    }
    const initialTime = task.timestamp && new Date(task.timestamp).toLocaleString();
    const startTime = task.startingTimestamp && new Date(task.startingTimestamp).toLocaleString();
    const endTime = task.endTimestamp && new Date(task.endTimestamp).toLocaleString();
    const result = JSON.parse(task.result).status;
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
    const { activeTask } = this.state;
    const {
      question, showModal, toggleModal, task,
    } = this.props;
    const rowCount = (question && question.tasks && question.tasks.length) || 0;
    const listHeight = Math.max(Math.min((rowCount * 50), 200), 100);
    return (
      <Modal
        show={showModal}
        onHide={toggleModal}
        backdrop
      >
        {question &&
          <Modal.Header closeButton>
            <Modal.Title>
              {question.naturalQuestion || question.natural_question}
            </Modal.Title>
          </Modal.Header>
        }
        <Modal.Body>
          {question &&
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
                    activeTask={this.state.activeTask}
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
                  {question &&
                    <button className="logButton" onClick={this.hideLogs}>
                      <span>
                        X
                      </span>
                    </button>
                  }
                  <button className="logButton" onClick={() => { this.getTaskLogs((question && question.tasks[activeTask].id) || task.id, activeTask); }}>
                    <span>
                      Refresh
                    </span>
                  </button>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <TaskLogs managerLogs={this.state.managerLogs} rankerLogs={this.state.rankerLogs} />
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
