import React from 'react';
import PropTypes from 'prop-types';

import Dialog from 'react-bootstrap-dialog';
import { NotificationContainer, NotificationManager } from 'react-notifications';

import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';

import QuestionPres from './components/question/QuestionPres';

import customPropTypes from './customPropTypes';

class Question extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      ready: false,
      user: {},
      question: {},
      answersets: [],
      subgraph: null,
      runningTasks: [],
      refreshBusy: false,
      answerBusy: false,
    };

    this.taskPollingWaitTime = 5000; // in ms

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
  }

  componentDidMount() {
    this.appConfig.questionData(
      this.props.id,
      data => this.setState({
        user: data.user,
        owner: data.owner,
        question: data.question,
        answersets: data.answerset_list,
        ready: true,
      }),
    );
    this.pullTasks();
  }
  pullTasks() {
    this.appConfig.questionTasks(
      this.props.id,
      (data) => {
        this.setState({ runningTasks: data }, this.updateTaskStatus);
      },
      err => console.log('Issues fetching active tasks', err),
    )
  }
  updateTaskStatus() {
    const tasks = this.state.runningTasks;

    const refreshBusy = tasks.updaters.length>0;
    const answerBusy = tasks.answerers.length>0;

    const refreshFinished = !refreshBusy && this.state.refreshBusy;
    const answerFinished = !answerBusy && this.state.answerBusy;

    this.setState({
      refreshBusy,
      answerBusy,
    });

    // If someing is going on, we will ask again soon
    if (refreshBusy || answerBusy) {
      setTimeout(this.pullTasks, this.taskPollingWaitTime);
    }
    if (refreshFinished) {
      this.notifyRefresh();
    }
    if (answerFinished) {
      this.appConfig.questionData(
        this.props.id,
        data => this.setState({
          answersets: data.answerset_list,
        }),
      );
      this.notifyAnswers();
    }
  }
  notifyRefresh() {
    NotificationManager.success(
      'We finished updating the knolwedge graph for this question. Go check it out!',
      'Knowledge Graph Update Complete',
      5000,
    );
  }
  notifyAnswers() {
    NotificationManager.success(
      'We finished finding new answers for this quesiton. Go check them out!',
      'New Answers are Available',
      5000,
    );
  }

  callbackNewAnswerset() {
    const q = this.state.question;
    // Send post request to build new answerset.
    this.appConfig.answersetCreate(
      q.id,
      (newData) => {
        this.addToTaskList({ answersetTask: newData.task_id });
        this.dialogMessage({
          title: 'Answer Set Generation in Progress',
          text: "We are working on developing a new Answer Set for this this question. This can take a little bit. We will send you an email when it's ready.",
          buttonText: 'OK',
          buttonAction: () => {},
        });
      },
      (err) => {
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
    const q = this.state.question;
    // Send post request to update question data.
    this.appConfig.questionRefresh(
      q.id,
      (newData) => {
        this.addToTaskList({ questionTask: newData.task_id });
        this.dialogMessage({
          title: 'Knowledge Graph Refresh in Progress',
          text: 'We are working on updating the knowledge graph for this question. This can take a little bit. We will send you an email when the updates are complete.',
          buttonText: 'OK',
          buttonAction: () => {},
        });
      },
      (err) => {
        this.dialogMessage({
          title: 'Trouble Refreshing the Knowledge Graph',
          text: 'This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
          buttonText: 'OK',
          buttonAction: () => {},
        });
      },
    );
  }

  callbackUpdateMeta(newMeta, fun) {
    this.appConfig.questionUpdateMeta(newMeta, fun);
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
          () => this.appConfig.redirect(this.appConfig.urls.questionList),
          () => {
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
  callbackFetchGraph(afterDoneFun) {
    this.appConfig.questionSubgraph(this.props.id, data => this.setState({ subgraph: data }, afterDoneFun()));
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
    const answerBusy = Boolean(newTask.answersetTask);
    const refreshBusy = Boolean(newTask.questionTask);

    this.setState(
      {
        answerBusy,
        refreshBusy,
      },
      this.pullTasks,
    );
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
        <QuestionPres
          user={this.state.user}
          owner={this.state.owner}
          callbackUpdateMeta={this.callbackUpdateMeta}
          callbackRefresh={this.callbackRefresh}
          callbackNewAnswerset={this.callbackNewAnswerset}
          callbackFork={this.callbackFork}
          callbackDelete={this.callbackDelete}
          callbackFetchGraph={this.callbackFetchGraph}
          answersetUrlFunc={a => this.appConfig.urls.answerset(a.id)}
          question={this.state.question}
          answersets={this.state.answersets}
          subgraph={this.state.subgraph}
          refreshBusy={this.state.refreshBusy}
          answerBusy={this.state.answerBusy}
          enableNewAnswersets={this.appConfig.enableNewAnswersets}
          enableNewQuestions={this.appConfig.enableNewQuestions}
          enableQuestionRefresh={this.appConfig.enableQuestionRefresh}
          enableQuestionEdit={this.appConfig.enableQuestionEdit}
          enableQuestionDelete={this.appConfig.enableQuestionDelete}
          enableQuestionFork={this.appConfig.enableQuestionFork}
        />
        <Dialog ref={(el) => { this.dialog = el; }} />
        <NotificationContainer
          ref={ref=>this.notificationSystem = ref}
          />
      </div>
    );
  }
  render() {
    return (
      <div>
        {!this.state.ready && this.renderLoading()}
        {this.state.ready && this.renderLoaded()}
      </div>
    );
  }
}

Question.propTypes = {
  config: customPropTypes.config.isRequired,
  id: PropTypes.string.isRequired,
};

export default Question;
