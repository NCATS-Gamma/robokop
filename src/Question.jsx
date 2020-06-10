import React from 'react';
import { Grid, Row, Col, Button } from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import NotificationSystem from 'react-notification-system';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import TasksModal from './components/shared/modals/TasksModal';
import QuestionPres from './components/question/QuestionPres';

import runningTaskFilter from './components/util/runningTaskFilter';

const _ = require('lodash');

class Question extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      conceptsReady: false,
      user: {},
      concepts: [],
      answersets: [],
      question: {},
      tasks: [],
      runningTasks: [],
      prevRunningTasks: [],
      refreshBusy: false,
      answerBusy: false,
      showModal: false,
    };

    this.taskPollingWaitTime = 2000; // in ms

    this.toggleModal = this.toggleModal.bind(this);
    this.sortTasks = this.sortTasks.bind(this);
    this.pullTasks = this.pullTasks.bind(this);
    this.updateTaskStatus = this.updateTaskStatus.bind(this);

    this.notifyRefresh = this.notifyRefresh.bind(this);
    this.notifyAnswers = this.notifyAnswers.bind(this);

    this.callbackFetchAnswerset = this.callbackFetchAnswerset.bind(this);
    this.callbackUpdateMeta = this.callbackUpdateMeta.bind(this);
    this.callbackRefresh = this.callbackRefresh.bind(this);
    this.callbackNewAnswerset = this.callbackNewAnswerset.bind(this);
    this.callbackFork = this.callbackFork.bind(this);
    this.callbackTaskStatus = this.callbackTaskStatus.bind(this);
    this.callbackDelete = this.callbackDelete.bind(this);
    this.callbackQuestionVisibility = this.callbackQuestionVisibility.bind(this);

    this.dialogMessage = this.dialogMessage.bind(this);
    this.dialogConfirm = this.dialogConfirm.bind(this);
  }

  componentDidMount() {
    this.appConfig.questionData(
      this.props.id,
      (data) => {
        const { question } = data.data;
        console.log('question', question);
        question.machine_question = JSON.parse(question.machine_question.body);
        const { answersets } = question.question_graph;

        this.setState({
          owner: question.ownerId,
          question,
          answersets,
          isValid: true,
          dataReady: true,
        });
      },
      (err) => {
        console.log('Errors encountered loading page: ', err);
        this.setState({
          isValid: false,
          dataReady: true,
        });
      },
    );
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
    this.appConfig.concepts((data) => {
      this.setState({
        concepts: data,
        conceptsReady: true,
      });
    });
    this.pullTasks();
  }
  toggleModal() {
    this.setState(prevState => ({ showModal: !prevState.showModal }));
  }
  sortTasks() {
    const { tasks } = this.state;
    if (tasks.length) {
      return tasks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return [];
  }
  pullTasks() {
    this.appConfig.questionTasks(
      this.props.id,
      (data) => {
        const tasks = data.data.question.tasks; //eslint-disable-line
        // These tasks include all tasks ever for this question

        // We need to find the running tasks
        const runningTasks = tasks.filter(runningTaskFilter);
        const prevRunningTasks = this.state.runningTasks;
        this.setState({ tasks, runningTasks, prevRunningTasks }, this.updateTaskStatus);
      },
      err => console.log('Issues fetching active tasks', err),
    );
  }
  updateTaskStatus() {
    const tasks = this.state.runningTasks;
    const prevTasks = this.state.prevRunningTasks;

    const answerTasks = tasks.filter(x => x.type.endsWith('answer_question'));
    const updateTasks = tasks.filter(x => x.type.endsWith('update_kg'));
    // console.log('Checking for finished tasks', prevTasks, tasks);

    const answerBusy = answerTasks.length > 0;
    const refreshBusy = updateTasks.length > 0;

    const answerFinished = !answerBusy && this.state.answerBusy;
    const refreshFinished = !refreshBusy && this.state.refreshBusy;

    this.setState({
      answerBusy,
      refreshBusy,
    });

    // If someing is going on, we will ask again soon
    if (refreshBusy || answerBusy) {
      setTimeout(this.pullTasks, this.taskPollingWaitTime);
    }
    if (refreshFinished) {
      const prevUpdateTasks = prevTasks.filter(x => x.type.endsWith('update_kg'));
      if (prevUpdateTasks.length > 0) {
        this.notifyRefresh(prevUpdateTasks[0].id);
      }
      setTimeout(this.pullTasks, this.taskPollingWaitTime);
    }
    if (answerFinished) {
      this.appConfig.questionData(
        this.props.id,
        (data) => {
          const { answersets } = data.data.question.question_graph;
          this.setState({ answersets });
        },
      );
      const prevAnswerTasks = prevTasks.filter(x => x.type.endsWith('answer_question'));
      if (prevAnswerTasks.length > 0) {
        this.notifyAnswers(prevAnswerTasks[0].id);
      }
      setTimeout(this.pullTasks, this.taskPollingWaitTime);
    }
  }
  notifyRefresh(taskId) {
    this.appConfig.taskStatus(taskId, (data) => {
      const success = ('status' in data.result) && (data.result.status === 'SUCCESS');
      const revoked = ('status' in data.result) && (data.result.status === 'REVOKED');
      if (success) {
        this.notificationSystem.addNotification({
          title: 'Knowledge Graph Update Complete',
          message: 'We finished updating the knowledge graph for this question. Go check it out!',
          level: 'success',
          dismissible: 'click',
          position: 'tr',
        });
      } else if (revoked) {
        console.log(taskId, data);
        this.notificationSystem.addNotification({
          title: 'Knowledge Graph Update Terminated',
          message: 'The knowledge graph update process was terminated before it could finish.',
          level: 'error',
          dismissible: 'click',
          position: 'tr',
        });
      } else {
        console.log(taskId, data);
        const { traceback } = data.result;
        this.notificationSystem.addNotification({
          title: 'Error Updating Knowledge Graph',
          message: `
            We encountered an error while trying to update the knowledge graph for this question.
            If this error persists please contact a system administrator.
            Error Report:
            ${traceback}
          `,
          level: 'error',
          dismissible: 'click',
          position: 'tr',
        });
      }
    });
  }
  notifyAnswers(taskId) {
    this.appConfig.taskStatus(taskId, (data) => {
      // console.log('Notify Answers', data);
      const success = ('status' in data.result) && (data.result.status === 'SUCCESS');
      const revoked = ('status' in data.result) && (data.result.status === 'REVOKED');
      const noAnswers = success && ('result' in data.result) && (data.result.result === 'NORESULTS');
      if (success && !noAnswers) {
        this.notificationSystem.addNotification({
          title: 'New Answers are Available',
          message: 'We finished finding new answers for this question. Go check them out!',
          level: 'success',
          dismissible: 'click',
          position: 'tr',
        });
      } else if (noAnswers) {
        this.notificationSystem.addNotification({
          title: 'No Answers Were Found',
          message: 'We were not able to find any answers to this question.',
          level: 'warning',
          dismissible: 'click',
          position: 'tr',
        });
      } else if (revoked) {
        this.notificationSystem.addNotification({
          title: 'New Answer Generation Was Canceled',
          message: 'Question answering was canceled before it was able to finish.',
          level: 'error',
          dismissible: 'click',
          position: 'tr',
        });
      } else {
        console.log(taskId, data);
        const { traceback } = data.result;
        this.notificationSystem.addNotification({
          title: 'Error Finding New Answers',
          message: `
            We encountered an error while trying to find new answers for this question.
            If this error persists please contact a system administrator.
            Error Report:
            ${traceback}
          `,
          level: 'error',
          dismissible: 'click',
          position: 'tr',
        });
      }
    });
  }

  callbackNewAnswerset() {
    // Send post request to build new answerset.
    this.appConfig.answersetCreate(
      this.props.id,
      (newData) => {
        console.log(newData);
        this.addToTaskList({ answersetTask: newData.task_id });
        this.notificationSystem.addNotification({
          title: 'Answer Set Generation in Progress',
          message: "We are working on developing a new Answer Set for this question. This can take a little bit. We will send you an email when it's ready.",
          level: 'info',
          position: 'tr',
          dismissible: 'click',
        });
      },
      () => {
        this.dialogMessage({
          title: 'Trouble Queuing Answer Set Generation',
          text: 'This could be due to an intermittent network error. If you encounter this error repeatedly, please contact a system administrator.',
          buttonText: 'OK',
          buttonAction: () => { },
        });
      },
    );
  }

  callbackRefresh() {
    // Send post request to update question data.
    this.appConfig.questionRefresh(
      this.props.id,
      (newData) => {
        this.addToTaskList({ questionTask: newData.task_id });
        this.notificationSystem.addNotification({
          title: 'Knowledge Graph Refresh in Progress',
          message: 'We are working on updating the knowledge graph for this question. This can take a little bit. We will send you an email when the updates are complete.',
          level: 'info',
          position: 'tr',
          dismissible: 'click',
        });
      },
      () => {
        this.dialogMessage({
          title: 'Trouble Refreshing the Knowledge Graph',
          text: 'This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
          buttonText: 'OK',
          buttonAction: () => { },
        });
      },
    );
  }

  callbackUpdateMeta(newMeta, fun) {
    this.appConfig.questionUpdateMeta(this.props.id, newMeta, fun);
  }
  callbackFork() {
    this.appConfig.questionFork(this.props.id);
  }
  callbackTaskStatus() {
    this.toggleModal();
  }

  callbackQuestionVisibility(visibility) {
    this.appConfig.questionVisibility(
      this.props.id,
      visibility,
      () => {
        const { question } = this.state;
        question.visibility = visibility.toUpperCase();
        this.setState({ question });
        this.notificationSystem.addNotification({
          title: 'Question visibility has been set successfully',
          message: `Question visibility has been set to ${visibility}.`,
          level: 'success',
          dismissible: 'click',
          position: 'tr',
        });
      },
      () => this.notificationSystem.addNotification({
        title: 'Unable to set question visibility',
        message: 'We apologize. We were unable to change this question\'s visiblity.',
        level: 'error',
        dismissible: 'click',
        position: 'tr',
      }),
    );
  }

  callbackDelete() {
    this.dialogConfirm(
      () => {
        this.dialogWait({
          title: 'Deleting Question...',
          text: '',
          showLoading: true,
        });

        // Actually try to delete the question here.
        this.appConfig.questionDelete(
          this.props.id,
          () => { console.log('Question Deleted'); this.appConfig.redirect(this.appConfig.urls.questions); },
          (err) => {
            console.log(err);
            this.dialogMessage({
              title: 'Question Not Deleted',
              text: 'We were unable to delete the question. This could due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
              buttonText: 'OK',
            });
          },
        );
      },
      {
        confirmationTitle: 'Delete Question?',
        confirmationText: 'Are you sure you want to delete this question? This action cannot be undone.',
        confirmationButtonText: 'Delete',
      },
    );
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
        Dialog.CancelAction(() => { }),
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
      onHide: () => { },
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
      },
    });
  }
  addToTaskList(newTask) {
    const isAnswerTask = Boolean(newTask.answersetTask);
    const isRefreshTask = Boolean(newTask.questionTask);

    // if (isAnswerTask) {
    //   console.log('Attempting to initializing new answerer task: ', newTask.answersetTask);
    // } else {
    //   console.log('Attempting to initializing new updater task: ', newTask.questionTask);
    // }
    setTimeout(
      () => {
        this.appConfig.questionTasks(
          this.props.id,
          (data) => {
            // Make sure this task id is in the list of tasks for this question
            const { tasks } = data.data.question;
            // console.log('got question tasks: ', tasks);
            let taskId = newTask.answersetTask;
            if (isRefreshTask) {
              taskId = newTask.questionTask;
            }
            // console.log('searching for ', taskId);
            // we are editing this in place, don't want to modify the tasks
            const thisTask = _.cloneDeep(tasks.find(t => t.id === taskId));
            // console.log('Found task', thisTask);
            if (!thisTask) {
              // Task went missing!@?!
              if (isAnswerTask) {
                console.log('Missing Question Task!!?!', taskId);

                this.dialogMessage({
                  title: 'Trouble Queuing Question Answering',
                  text: 'We have lost track of your task. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
                  buttonText: 'OK',
                  buttonAction: () => { },
                });
              } else {
                // isRefreshTask
                console.log('Missing Question Task!!?!', taskId);

                this.dialogMessage({
                  title: 'Trouble Queuing Knowledge Graph Update',
                  text: 'We have lost track of your tasks. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
                  buttonText: 'OK',
                  buttonAction: () => { },
                });
              }
              return;
            }
            // Otherwise, it could be all done
            if (thisTask.result && typeof thisTask.result === 'string') {
              thisTask.result = JSON.parse(thisTask.result);
            }

            if (thisTask.result && (Object.keys(thisTask.result).length > 0)) {
              // console.log('We have a result already?', thisTask.result);
              // We have a result already
              if (isAnswerTask) {
                this.notifyAnswers(taskId);
              } else {
                // isRefreshTask
                this.notifyRefresh(taskId);
              }
              return;
            }

            // We have a task but no result
            const runningTasks = tasks.filter(runningTaskFilter);
            // Find the running tasks, update state, queue updateTaskStatus
            this.setState(
              {
                tasks,
                prevRunningTasks: runningTasks,
                runningTasks,
                answerBusy: isAnswerTask,
                refreshBusy: isRefreshTask,
              },
              this.updateTaskStatus,
            );
          },
          err => console.log('Issues fetching active tasks', err),
        );
      },
      500,
    );
  }

  callbackFetchAnswerset(aid, successFun, failureFun) {
    this.appConfig.answersetData(`${this.props.id}_${aid}`, successFun, failureFun);
  }
  render() {
    const ready = this.state.userReady && this.state.conceptsReady;
    return (
      <div>
        {ready ?
          <div>
            <Header
              config={this.props.config}
              user={this.state.user}
            />
            <Grid>
              {this.state.dataReady && this.state.isValid &&
                <QuestionPres
                  user={this.state.user}
                  owner={this.state.owner}
                  callbackUpdateMeta={this.callbackUpdateMeta}
                  callbackRefresh={this.callbackRefresh}
                  callbackNewAnswerset={this.callbackNewAnswerset}
                  callbackFork={this.callbackFork}
                  callbackDelete={this.callbackDelete}
                  callbackTaskStatus={this.callbackTaskStatus}
                  callbackFetchAnswerset={this.callbackFetchAnswerset}
                  callbackQuestionVisibility={this.callbackQuestionVisibility}
                  answersetUrl={(a) => {
                    if (a && (typeof a === 'object') && 'id' in a) {
                      return this.appConfig.urls.answerset(this.props.id, a.id);
                    }
                    return '';
                  }}
                  question={this.state.question}
                  answersets={this.state.answersets}
                  concepts={this.state.concepts}
                  refreshBusy={this.state.refreshBusy}
                  answerBusy={this.state.answerBusy}
                  enableNewAnswersets={this.appConfig.enableNewAnswersets}
                  enableNewQuestions={this.appConfig.enableNewQuestions}
                  enableQuestionRefresh={this.appConfig.enableQuestionRefresh}
                  enableQuestionEdit={this.appConfig.enableQuestionEdit}
                  enableQuestionDelete={this.appConfig.enableQuestionDelete}
                  enableQuestionFork={this.appConfig.enableQuestionFork}
                  enableTaskStatus={this.appConfig.enableTaskStatus}
                />
              }
              {this.state.dataReady && !this.state.isValid &&
                <div>
                  <Row>
                    <Col md={12}>
                      <h3>
                        {"We're sorry but we encountered an error trying to find this question."}
                      </h3>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Button bsSize="large" href={this.appConfig.urls.questions}>
                        Browse Questions
                      </Button>
                    </Col>
                  </Row>
                </div>
              }
              {!this.state.dataReady &&
                <Loading />
              }
            </Grid>
            <Footer config={this.props.config} />
            <TasksModal header={this.state.question.natural_question} tasks={this.sortTasks()} user={this.state.user} showModal={this.state.showModal} toggleModal={this.toggleModal} />
            <Dialog ref={(el) => { this.dialog = el; }} />
            <NotificationSystem
              ref={(ref) => { this.notificationSystem = ref; }}
            />
          </div>
          :
          <p />
        }
      </div>
    );
  }
}

export default Question;
