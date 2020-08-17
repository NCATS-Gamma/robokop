import React from 'react';
import Dialog from 'react-bootstrap-dialog';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Grid, Row } from 'react-bootstrap';


import './newQuestion.css';
import AppConfig from '../../AppConfig';
import Header from '../Header';
import Footer from '../Footer';
import Loading from '../Loading';
import LoadingNlpQuestionModal from '../shared/modals/LoadingNlpQuestion';
import QuestionBuilder from './questionBuilder/QuestionBuilder';


@inject(({ store }) => ({ store }))
@observer
class QuestionNew extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);
    this.onCreate = this.onCreate.bind(this);
    this.onResetQuestion = this.onResetQuestion.bind(this);
    this.onDownloadQuestion = this.onDownloadQuestion.bind(this);
    this.onSubmitQuestion = this.onSubmitQuestion.bind(this);
    this.getNlpParsedQuestion = this.getNlpParsedQuestion.bind(this);
  }

  componentDidMount() {
    this.props.store.getQuestionData(this.props.initializationId);
  }

  componentWillUnmount() {
    this.props.store.cleanup();
  }

  /**
   * Converts provided JSON serializable data into a .json file that is downloaded
   * to the user's machine via file-save dialog
   * @param {JSON serializable object} data - JSON data to be provided as download
   * @param {*} filename - Default filename for the provided .json file
   */
  provideJsonDownload(data, filename) {
    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = filename;
    a.href = url;
    a.click();
    a.remove();
  }

  onDownloadQuestion() {
    const data = this.props.store.getMachineQuestionSpecJson;
    this.provideJsonDownload(data, 'robokopMachineQuestion.json');
  }

  onSubmitQuestion() {
    const { store } = this.props;
    this.onCreate({ questionText: store.questionName, machineQuestion: store.getMachineQuestionSpecJson.machine_question, maxConnect: store.max_connectivity });
  }

  onResetQuestion() {
    if (window.confirm('Are you sure you want to reset this question? This action cannot be undone.')) {
      this.props.store.resetQuestion();
    }
  }

  onCreate({ questionText, machineQuestion, maxConnect }) {
    const newBoardInfo = {
      natural_question: questionText,
      notes: '',
      machine_question: machineQuestion,
      max_connectivity: maxConnect,
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
      (err) => {
        this.dialogMessage({
          title: 'Trouble Creating Question',
          text: `We ran in to problems creating this question. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators. ${err.response.data.message}`,
          buttonText: 'OK',
          buttonAction: () => {},
        });
      },
    );
  }

  // Prevent default form submit and make call to parse NLP question via store method
  getNlpParsedQuestion(event) {
    event.preventDefault();
    this.props.store.nlpParseQuestion();
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

  render() {
    const { store } = this.props;
    const ready = store.conceptsReady && store.dataReady && store.userReady && store.predicatesReady;
    return (
      <div>
        {ready ?
          <div className="question-new">
            <Header
              config={this.props.config}
              user={toJS(store.user)}
            />
            <Grid>
              <Row>
                <h1 className="robokopApp">
                  Ask a Question
                </h1>
              </Row>
              <Row>
                <QuestionBuilder
                  store={store}
                  download={this.onDownloadQuestion}
                  reset={this.onResetQuestion}
                  submit={this.onSubmitQuestion}
                  width={this.props.width}
                />
              </Row>
            </Grid>
            <Footer config={this.props.config} />
            <Dialog ref={(el) => { this.dialog = el; }} />
            {store.nlpFetching && <LoadingNlpQuestionModal />}
          </div>
          :
          <Loading />
        }
      </div>
    );
  }
}

export default QuestionNew;
