import React from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import { Grid, Row, Tabs, Tab } from 'react-bootstrap';
import FaDownload from 'react-icons/lib/fa/download';

import './newQuestion.css';
import AppConfig from '../../AppConfig';
import AnswersetStore from '../../stores/messageAnswersetStore';
import Loading from '../Loading';
import Header from '../Header';
import Footer from '../Footer';
import MessageAnswersetTable from '../answerset/MessageAnswersetTable';
import AnswersetGraph from '../answerset/AnswersetGraph';
import SimpleQuestionGraph from './subComponents/SimpleQuestionGraph';
import QuickQuestionError from './subComponents/QuickQuestionError';
import QuestionBuilder from './subComponents/QuestionBuilder';


@inject(({ store }) => ({ store }))
@observer
class SimpleQuestion extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    // this store will get initialized once we have answers
    this.answersetStore = null;

    this.state = {
      ready: false,
      user: {},
      message: {},
      loading: false,
      loaded: false,
      tabKey: 1,
      questionFail: false,
      errorMessage: '',
    };

    this.onResetQuestion = this.onResetQuestion.bind(this);
    this.onDownloadQuestion = this.onDownloadQuestion.bind(this);
    this.onDownloadAnswer = this.onDownloadAnswer.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.resetQuestion = this.resetQuestion.bind(this);
  }

  componentDidMount() {
    this.props.store.getQuestionData('');
    this.appConfig.user(
      data => this.setState({
        user: data,
        ready: true,
      }),
      (err) => {
        console.log('Failed to retrieve user information. This may indicate a connection issue.');
        console.log(err);
      },
    );
  }

  onDownloadQuestion() {
    const data = this.props.store.getMachineQuestionSpecJson;
    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'robokopMachineQuestion.json';
    a.href = url;
    a.click();
    a.remove();
  }

  onDownloadAnswer() {
    const data = this.state.message;

    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'answerset.json';
    a.href = url;
    a.click();
    a.remove();
  }

  onResetQuestion() {
    if (window.confirm('Are you sure you want to reset this question? This action cannot be undone.')) {
      this.props.store.resetQuestion();
    }
  }

  onSubmit() {
    const questionText = this.props.store.questionName;
    const machineQuestion = this.props.store.getMachineQuestionSpecJson.machine_question;
    const maxConnect = this.props.store.max_connectivity;
    const newBoardInfo = {
      natural_question: questionText,
      notes: '',
      machine_question: machineQuestion,
      max_connectivity: maxConnect,
    };
    this.setState({ loading: true, loaded: false });
    this.appConfig.simpleQuick(
      newBoardInfo,
      (data) => {
        if (!data.answers.length) {
          throw Error('No answers were found');
        }
        this.answersetStore = new AnswersetStore(data);
        this.setState({ message: data, loading: false, loaded: true });
      },
      (err) => {
        console.log('Trouble asking question:', err);
        let errorMessage = '';
        if (err.response || err.response) {
          errorMessage = 'Please check the console for a more descriptive error message';
        } else {
          errorMessage = err.message;
        }
        this.setState({ loading: false, questionFail: true, errorMessage });
      },
    );
  }

  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }

  resetQuestion() {
    this.setState({ questionFail: false, errorMessage: '' });
  }

  render() {
    const {
      user, ready, loading, loaded, tabKey, questionFail, errorMessage,
    } = this.state;
    const { config } = this.props;
    const validUser = this.appConfig.ensureUser(user);
    const questionLink = !validUser.is_authenticated ? <a href={this.appConfig.urls.login}>Sign In</a> : <a href={this.appConfig.urls.questionDesign}>Go Here</a>;
    return (
      <div>
        {ready ?
          <div>
            <Header config={config} user={user} />
            <Grid>
              <Row>
                {!loading && !loaded &&
                  <div>
                    <h1 className="robokopApp">
                      Ask a Quick Question
                      <br />
                      <small>
                        This question will not be saved. If you would like to save a question, please {questionLink}.
                      </small>
                    </h1>
                    <QuestionBuilder
                      store={this.props.store}
                      download={this.onDownloadQuestion}
                      reset={this.onResetQuestion}
                      submit={this.onSubmit}
                      width={this.props.width}
                    />
                  </div>
                }
                {loaded &&
                  <div>
                    <div style={{ position: 'block', paddingBottom: '10px' }}>
                      <h1 style={{ display: 'inline' }}>{this.props.store.questionName}</h1>
                      <span style={{ fontSize: '22px', float: 'right', marginTop: '10px' }} title="Download">
                        <FaDownload style={{ cursor: 'pointer' }} onClick={this.onDownloadAnswer} />
                      </span>
                    </div>
                    <SimpleQuestionGraph
                      store={this.answersetStore}
                      concepts={toJS(this.props.store.concepts)}
                    />
                    <Tabs
                      activeKey={tabKey}
                      onSelect={this.handleTabSelect}
                      animation
                      id="answerset_tabs"
                      mountOnEnter
                    >
                      <Tab
                        eventKey={1}
                        title="Answers Table"
                      >
                        <MessageAnswersetTable
                          concepts={toJS(this.props.store.concepts)}
                          store={this.answersetStore}
                        />
                      </Tab>
                      <Tab
                        eventKey={2}
                        title="Aggregate Graph"
                      >
                        <AnswersetGraph
                          concepts={toJS(this.props.store.concepts)}
                          store={this.answersetStore}
                        />
                      </Tab>
                    </Tabs>
                  </div>
                }
                {loading &&
                  <Loading
                    message={<p style={{ textAlign: 'center' }}>Loading Answerset</p>}
                  />
                }
              </Row>
            </Grid>
            <Footer config={config} />
            <QuickQuestionError
              showModal={questionFail}
              closeModal={this.resetQuestion}
              errorMessage={errorMessage}
            />
          </div>
        :
          <Loading />
        }
      </div>
    );
  }
}

export default SimpleQuestion;
