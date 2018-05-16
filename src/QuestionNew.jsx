import React from 'react';
import Dialog from 'react-bootstrap-dialog';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';

import QuestionNewPres from './components/questionNew/QuestionNewPres';
import CardTypes from './components/questionNew/QuestionNewCardTypes';

class QuestionNew extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      dataReady: false,
      conceptsReady: false,
      user: {},
      name: '',
      natural: '',
      notes: '',
      machineQuestion: [],
      isFork: false,
      initializationQuestion: {},
    };

    this.onCreate = this.onCreate.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onSearch = this.onSearch.bind(this);

    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangeNatural = this.handleChangeNatural.bind(this);
    this.handleChangeNotes = this.handleChangeNotes.bind(this);
    this.handleChangeMachineQuestion = this.handleChangeMachineQuestion.bind(this);
  }

  componentDidMount() {
    this.appConfig.concepts((data) => {
      this.setState({
        concepts: data,
        conceptsReady: true,
      });
    });

    this.appConfig.user((data) => {
      this.setState({
        user: data,
        userReady: true,
      });
    });
    const isFork = this.props.initializationId !== '';
    if (isFork) {
      this.appConfig.questionData(
        this.props.initializationId,
        data => this.setState({
          isFork,
          name: data.question.name,
          natural: data.question.natural_question,
          notes: data.question.notes,
          initializationQuestion: data.question,
          dataReady: true,
        }),
      );
    } else {
      this.setState({
        isFork,
        name: '',
        natural: '',
        notes: '',
        initializationQuestion: {},
        dataReady: true,
      })
    }
  }

  onCreate() {
    const newBoardInfo = {
      name: this.state.name,
      natural: this.state.natural,
      notes: this.state.notes,
      machine_question: this.state.machineQuestion,
    };

    // Splash wait overlay
    this.dialogWait({
      title: 'Creating Question...',
      text: '',
      showLoading: true,
    });

    this.appConfig.questionCreate(
      newBoardInfo,
      data => this.appConfig.redirect(this.appConfig.urls.question(data)), // Success redirect to the new question page
      () => {
        this.dialogMessage({
          title: 'Trouble Creating Question',
          text: 'We ran in to problems creating this question. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators.',
          buttonText: 'OK',
          buttonAction: () => {},
        });
      },
    );
  }

  onCancel() {
    this.appConfig.back();
  }

  onSearch(input, nodeType) {
    return this.appConfig.questionNewSearch(input, nodeType);
  }
  onValidate(postData) {
    this.appConfig.questionNewValidate(postData);
  }
  onTranslate(postData) {
    this.appConfig.questionNewTranslate(postData);
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

  handleChangeName(e) {
    this.setState({ name: e.target.value });
  }
  handleChangeNatural(e) {
    this.setState({ natural: e.target.value });
  }
  handleChangeNotes(e) {
    this.setState({ notes: e.target.value });
  }
  handleChangeMachineQuestion(newMachineQuestionUi) {
    // Trim off the extra meta data in the machineQuestion, dependent on node type
    const newMachineQuestion = newMachineQuestionUi.map((e) => {
      let meta = {};
      const type = e.displayType;
      let label = e.nodeType;
      switch (e.type) {
        case CardTypes.NAMEDNODETYPE:
          label = e.name;
          meta = { identifier: e.nameId };
          break;
        case CardTypes.NODETYPE:
          label = e.nodeType;
          break;
        case CardTypes.NUMNODES:
          label = `?[${e.numNodesMin}...${e.numNodesMax}]`;
          // type = 'Unspecified';
          meta = { numNodesMin: e.numNodesMin, numNodesMax: e.numNodesMax };
          break;
        default:
      }
      return {
        id: e.id,
        nodeSpecType: e.type,
        type,
        label,
        meta,
      };
    });

    this.setState({ machineQuestion: newMachineQuestion });
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
        <QuestionNewPres
          name={this.state.name}
          natural={this.state.natural}
          notes={this.state.notes}
          machineQuestion={this.state.machineQuestion} // Used only for graph display
          isFork={this.state.isFork}
          initializationQuestion={this.state.initializationQuestion}
          concepts={this.state.concepts}
          handleChangeName={this.handleChangeName}
          handleChangeNatural={this.handleChangeNatural}
          handleChangeNotes={this.handleChangeNotes}
          handleChangeMachineQuestion={this.handleChangeMachineQuestion}
          callbackCreate={this.onCreate}
          callbackSearch={this.onSearch}
          callbackValidate={this.onValidate}
          callbackTranslate={this.onTranslate}
          callbackCancel={this.onCancel}
        />
        <Dialog ref={(el) => { this.dialog = el; }} />
      </div>
    );
  }
  render() {
    const ready = this.state.conceptsReady && this.state.dataReady && this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default QuestionNew;
