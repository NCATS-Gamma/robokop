import React from 'react';
import PropTypes from 'prop-types';

import Dialog from 'react-bootstrap-dialog';

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
    };

    this.callbackNewAnswerset = this.callbackNewAnswerset.bind(this);
    this.callbackUpdateMeta = this.callbackUpdateMeta.bind(this);
    this.callbackUpdateKG = this.callbackUpdateKG.bind(this);
    this.callbackFork = this.callbackFork.bind(this);
    this.callbackDelete = this.callbackDelete.bind(this);
    this.callbackFetchGraph = this.callbackFetchGraph.bind(this);

    this.dialogMessage = this.dialogMessage.bind(this);
    this.dialogConfirm = this.dialogConfirm.bind(this);
  }

  componentDidMount() {
    this.appConfig.questionData(this.props.id, data => this.setState({
      user: data.user,
      question: data.question,
      answersets: data.answerset_list,
      ready: true,
    }));
  }

  callbackNewAnswerset() {
    const q = this.state.question;
    // Send post request to build new answerset.
    this.appConfig.answersetNew(q.id);
  }

  callbackUpdateKG() {
    const q = this.state.question;
    // Send post request to update question data.
    this.appConfig.updateKG(q.id);
  }

  callbackUpdateMeta(newMeta) {
    const q = this.state.question;
    const u = this.state.user;
    console.log('Send post request to update question data.');
  }
  callbackFork() {
    const q = this.state.question;
    const u = this.state.user;
    console.log('Fork question for user. Get the new question ID. Then show a message. Redirect to new question page');
  }
  callbackDelete() {
    console.log('Delete this question if possible. Then show a message. Redirect to questions.');
    const q = this.state.question;
    const u = this.state.user;

    this.dialogConfirm(
      () => {
        this.dialogWait({
          title: 'Deleting Question...',
          text: '',
          showLoading: true,
        });
        
        // Actually try to delete the question here.
        this.appConfig.questionDelete(
          q,
          u,
          () => {
            window.open(this.appConfig.urls.questionList, '_self');
          },
          () => {
            this.dialogMessage({
              title: 'Question Not Deleted',
              text: 'We were unable to delete the question.',
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
    const q = this.state.question;
    this.appConfig.questionSubgraph(this.props.id, (data) => this.setState({ subgraph: data }, afterDoneFun()));
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
        <QuestionPres
          callbackNewAnswerset={this.callbackNewAnswerset}
          callbackUpdateMeta={this.callbackUpdateMeta}
          callbackUpdate={this.callbackUpdateKG}
          callbackFork={this.callbackFork}
          callbackDelete={this.callbackDelete}
          callbackFetchGraph={this.callbackFetchGraph}
          answersetUrlFunc={a => this.appConfig.urls.answerset(a.id)}
          question={this.state.question}
          answersets={this.state.answersets}
          subgraph={this.state.subgraph}
        />
        <Dialog ref={(el) => { this.dialog = el; }} />
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
