import React from 'react';
import PropTypes from 'prop-types';

import { Grid, Row, Col, Button } from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import NotificationSystem from 'react-notification-system';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import QuestionPres from './components/question/QuestionPres';

class Question extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      conceptsReady: false,
      user: {},
      question: {},
      concepts: [],
      answersets: [],
      subgraph: null,
      runningTasks: [],
      prevRunningTasks: [],
      refreshBusy: false,
      answerBusy: false,
      initializerBusy: false,
      isValid: false,
    };

    this.taskPollingWaitTime = 2000; // in ms

    this.pullTasks = this.pullTasks.bind(this);
    this.updateTaskStatus = this.updateTaskStatus.bind(this);

    this.notifyRefresh = this.notifyRefresh.bind(this);
    this.notifyAnswers = this.notifyAnswers.bind(this);

    this.callbackUpdateMeta = this.callbackUpdateMeta.bind(this);
    this.callbackRefresh = this.callbackRefresh.bind(this);
    this.callbackNewAnswerset = this.callbackNewAnswerset.bind(this);
    this.callbackFork = this.callbackFork.bind(this);
    this.callbackDelete = this.callbackDelete.bind(this);
    this.callbackFetchGraph = this.callbackFetchGraph.bind(this);

    this.dialogMessage = this.dialogMessage.bind(this);
    this.dialogConfirm = this.dialogConfirm.bind(this);

    this.callbackAnswerset = this.callbackAnswerset.bind(this);
  }

  componentDidMount() {
    this.appConfig.questionData(
      this.props.id,
      data => this.setState({
        owner: data.owner,
        question: data.question,
        answersets: data.answerset_list,
        isValid: true,
        dataReady: true,
      }),
      () => this.setState({
        isValid: false,
        dataReady: true,
      }),
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
  pullTasks() {
    this.appConfig.questionTasks(
      this.props.id,
      (data) => {
        const prevRunningTasks = this.state.runningTasks;
        this.setState({ runningTasks: data, prevRunningTasks }, this.updateTaskStatus);
      },
      err => console.log('Issues fetching active tasks', err),
    );
  }
  updateTaskStatus() {
    const tasks = this.state.runningTasks;
    const prevTasks = this.state.prevRunningTasks;

    // console.log('Checking for finished tasks', prevTasks, tasks);

    const refreshBusy = tasks.updaters.length > 0;
    const answerBusy = tasks.answerers.length > 0;
    const initializerBusy = false;

    const refreshFinished = !refreshBusy && this.state.refreshBusy;
    const answerFinished = !answerBusy && this.state.answerBusy;
    const initializerFinished = false;

    this.setState({
      refreshBusy,
      answerBusy,
      initializerBusy,
    });

    // If someing is going on, we will ask again soon
    if (refreshBusy || answerBusy || initializerBusy) {
      setTimeout(this.pullTasks, this.taskPollingWaitTime);
    }
    if (initializerFinished) {
      this.appConfig.questionData(
        this.props.id,
        data => this.setState({
          answersets: data.answerset_list,
        }),
      );
      if (('initializers' in prevTasks) && Array.isArray(prevTasks.initializers) && (prevTasks.initializers.length > 0) && ('uuid' in prevTasks.initializers[0])) {
        this.notifyInitializer(prevTasks.initializers[0].uuid);
      }
      setTimeout(this.pullTasks, this.taskPollingWaitTime);
      return;
    }
    if (refreshFinished && !initializerBusy) {
      if (('updaters' in prevTasks) && Array.isArray(prevTasks.updaters) && (prevTasks.updaters.length > 0) && ('uuid' in prevTasks.updaters[0])) {
        this.notifyRefresh(prevTasks.updaters[0].uuid);
      }
      setTimeout(this.pullTasks, this.taskPollingWaitTime);
    }
    if (answerFinished && !initializerBusy) {
      this.appConfig.questionData(
        this.props.id,
        data => this.setState({
          answersets: data.answerset_list,
        }),
      );
      if (('answerers' in prevTasks) && Array.isArray(prevTasks.answerers) && (prevTasks.answerers.length > 0) && ('uuid' in prevTasks.answerers[0])) {
        this.notifyAnswers(prevTasks.answerers[0].uuid);
      }
      setTimeout(this.pullTasks, this.taskPollingWaitTime);
    }
  }
  notifyRefresh(taskId) {
    this.appConfig.taskStatus(taskId, (data) => {
      const success = data.state !== 'FAILURE';
      if (success) {
        this.notificationSystem.addNotification({
          title: 'Knowledge Graph Update Complete',
          message: 'We finished updating the knolwedge graph for this question. Go check it out!',
          level: 'success',
          dismissible: 'click',
          position: 'tr',
        });
      } else {
        console.log(taskId, data);
        this.notificationSystem.addNotification({
          title: 'Error Updating Knowledge Graph',
          message: `We encountered an error while trying to update the knowledge graph for this question. If this error persists please contact a system administrator.\r\n\r\nError Report:\r\n${data.result}`,
          level: 'error',
          dismissible: 'click',
          position: 'tr',
        });
      }
    });
  }
  notifyAnswers(taskId) {
    this.appConfig.taskStatus(taskId, (data) => {
      const success = data.state !== 'FAILURE';
      if (success) {
        this.notificationSystem.addNotification({
          title: 'New Answers are Available',
          message: 'We finished finding new answers for this question. Go check them out!',
          level: 'success',
          dismissible: 'click',
          position: 'tr',
        });
      } else {
        console.log(taskId, data);
        this.notificationSystem.addNotification({
          title: 'Error Finding New Answers',
          message: `We encountered an error while trying to find new answers for this question. If this error persists please contact a system administrator.\r\n\r\nError Report:\r\n${data.result}`,
          level: 'error',
          dismissible: 'click',
          position: 'tr',
        });
      }
    });
  }
  notifyInitializer(taskId) {
    this.appConfig.taskStatus(taskId, (data) => {
      const success = data.state !== 'FAILURE';
      if (success) {
        this.notificationSystem.addNotification({
          title: 'Initial Answers are Available',
          message: 'We finished finding initial answers for this question. Go check them out!',
          level: 'success',
          dismissible: 'click',
          position: 'tr',
        });
      } else {
        console.log(taskId, data);
        this.notificationSystem.addNotification({
          title: 'Error Finding Initial Answers',
          message: `We encountered an error while trying to find answers for this question. Robokop may not be capable of answering the question as phrased.\r\n\r\nError Report:\r\n${data.result}`,
          level: 'error',
          dismissible: 'click',
          position: 'tr',
        });
      }
    });
  }

  callbackNewAnswerset() {
    const q = this.state.question;
    // Send post request to build new answerset.
    this.appConfig.answersetCreate(
      q.id,
      (newData) => {
        this.addToTaskList({ answersetTask: newData.task_id });
        this.notificationSystem.addNotification({
          title: 'Answer Set Generation in Progress',
          message: "We are working on developing a new Answer Set for this this question. This can take a little bit. We will send you an email when it's ready.",
          level: 'info',
          position: 'tr',
          dismissible: 'click',
        });
      },
      () => {
        this.dialogMessage({
          title: 'Trouble Queuing Answer Set Generation',
          text: 'This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
          buttonText: 'OK',
          buttonAction: () => {},
        });
      },
    );
  }

  callbackRefresh() {
    this.setState({ subgraph: null });
    const q = this.state.question;
    // Send post request to update question data.
    this.appConfig.questionRefresh(
      q.id,
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
          buttonAction: () => {},
        });
      },
    );
  }
  callbackAnswerset(answersetId) {
    this.appConfig.redirect(this.appConfig.urls.answerset(this.props.id, answersetId));
  }
  callbackUpdateMeta(newMeta, fun) {
    this.appConfig.questionUpdateMeta(this.props.id, newMeta, fun);
  }
  callbackFork() {
    const q = this.state.question;
    this.appConfig.questionFork(q.id);
  }
  callbackDelete() {
    const q = this.state.question;

    this.dialogConfirm(
      () => {
        this.dialogWait({
          title: 'Deleting Question...',
          text: '',
          showLoading: true,
        });

        // Actually try to delete the question here.
        this.appConfig.questionDelete(
          q.id,
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
  callbackFetchGraph(afterDoneFun, afterDoneFunFail) {
    this.appConfig.questionSubgraph(this.props.id, data => this.setState({ subgraph: data }, afterDoneFun()), (err) => { console.log(err); this.setState({ subgraph: { edges: [], nodes: [] } }, afterDoneFunFail()); });
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
  addToTaskList(newTask) {
    const isAnswerTask = Boolean(newTask.answersetTask);
    const isRefreshTask = Boolean(newTask.questionTask);

    if (isAnswerTask) {
      console.log('Attempting to initializing new answerer task: ', newTask.answersetTask);
    } else {
      console.log('Attempting to initializing new updater task: ', newTask.questionTask);
    }
    setTimeout(
      () => {
        this.appConfig.questionTasks(
          this.props.id,
          (data) => {
            console.log('Checking if our new task actually started', data);
            let allOk = true;
            if (isAnswerTask) {
              const ind = data.answerers.findIndex(a => a.uuid === newTask.answersetTask);
              if (ind < 0) {
                // Check to see if it happens to be done already?
                // this.appConfig.taskStatus(newTask.answersetTask, )
                // done already?
                console.log('Missing Answerer Task!!?!', newTask.answersetTask);
                allOk = false;
                this.dialogMessage({
                  title: 'Trouble Queuing Answer Set Generation',
                  text: 'We have lost track of your tasks. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
                  buttonText: 'OK',
                  buttonAction: () => {},
                });
              }
            }
            if (isRefreshTask) {
              const ind = data.updaters.findIndex(a => a.uuid === newTask.questionTask);
              if (ind < 0) {
                console.log('Missing Quesetion Task!!?!', newTask.questionTask);
                allOk = false;
                this.dialogMessage({
                  title: 'Trouble Queuing Knowledge Graph Update',
                  text: 'We have lost track of your tasks. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
                  buttonText: 'OK',
                  buttonAction: () => {},
                });
              }
            }
            // FIX ME this assumes a single new task at a time!
            if (allOk) {
              this.setState(
                {
                  prevRunningTasks: data,
                  runningTasks: data,
                  answerBusy: isAnswerTask,
                  refreshBusy: isRefreshTask,
                },
                this.updateTaskStatus,
              );
            } else {
              if (isAnswerTask) {
                this.dialogMessage({
                  title: 'Trouble Queuing Answer Set Generation',
                  text: 'We have lost track of your tasks. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
                  buttonText: 'OK',
                  buttonAction: () => {},
                });
              }
              if (isRefreshTask) {
                this.dialogMessage({
                  title: 'Trouble Queuing Knowledge Graph Update',
                  text: 'We have lost track of your tasks. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
                  buttonText: 'OK',
                  buttonAction: () => {},
                });
              }
            }
          },
          err => console.log('Issues fetching active tasks', err),
        );
      },
      500,
    );
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
              Unknown Question
            </h3>
            <p>
              {"We're sorry but we can't find this question."}
            </p>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Button bsSize="large" href={this.appConfig.urls.questions}>
              Browse Questions
            </Button>
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
          <QuestionPres
            user={this.state.user}
            owner={this.state.owner}
            callbackUpdateMeta={this.callbackUpdateMeta}
            callbackRefresh={this.callbackRefresh}
            callbackNewAnswerset={this.callbackNewAnswerset}
            callbackFork={this.callbackFork}
            callbackDelete={this.callbackDelete}
            callbackFetchGraph={this.callbackFetchGraph}
            callbackAnswersetOpen={this.callbackAnswerset}
            question={this.state.question}
            answersets={this.state.answersets}
            subgraph={this.state.subgraph}
            concepts={this.state.concepts}
            refreshBusy={this.state.refreshBusy}
            answerBusy={this.state.answerBusy}
            initializerBusy={this.state.initializerBusy}
            enableNewAnswersets={this.appConfig.enableNewAnswersets}
            enableNewQuestions={this.appConfig.enableNewQuestions}
            enableQuestionRefresh={this.appConfig.enableQuestionRefresh}
            enableQuestionEdit={this.appConfig.enableQuestionEdit}
            enableQuestionDelete={this.appConfig.enableQuestionDelete}
            enableQuestionFork={this.appConfig.enableQuestionFork}
          />
        }
        {!this.state.isValid &&
          this.renderInvalid()
        }
        <Dialog ref={(el) => { this.dialog = el; }} />
        <NotificationSystem
          ref={(ref) => { this.notificationSystem = ref; }}
        />
      </div>
    );
  }
  render() {
    const ready = this.state.dataReady && this.state.userReady && this.state.conceptsReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

Question.propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }).isRequired,
  id: PropTypes.string.isRequired,
};

export default Question;
