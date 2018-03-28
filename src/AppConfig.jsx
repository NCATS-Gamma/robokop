import axios from 'axios';
import axiosRetry from 'axios-retry';

class AppConfig {
  constructor(config) {
    this.config = config;

    this.comms = axios.create();
    axiosRetry(this.comms, { retries: 3 }); // Retry for request timeouts, help with spotty connections.

    this.urls = {
      landing: this.url('landing'),
      login: this.url('login'),
      logout: this.url('logout'),
      admin: this.url('admin'),
      account: this.url('account'),
      questionList: this.url('questions'),
      questionNew: this.url('q/new'),
      question: questionId => this.url(`q/${questionId}`),
      answerset: answersetId => this.url(`a/${answersetId}`),
      answer: (answersetId, answerId) => this.url(`a/${answersetId}/${answerId}`),
    };

    this.urls.question = this.urls.question.bind(this);
    this.urls.answerset = this.urls.answerset.bind(this);
    this.urls.answer = this.urls.answer.bind(this);

    this.api = {
      questionNewSearch: this.questionNewSearch.bind(this),
      questionNewValidate: this.questionNewValidate.bind(this),
      questionNewTranslate: this.questionNewTranslate.bind(this),
      questionUpdate: this.url('q/edit'),
      questionDelete: this.url('q/delete'),
      questionFork: this.url('q/fork'),
    };

    this.url = this.url.bind(this);

    this.landingData = this.landingData.bind(this);
    this.accountData = this.accountData.bind(this);
    this.adminData = this.adminData.bind(this);
    this.questionNewData = this.questionNewData.bind(this);
    this.questionUpdateMeta = this.questionUpdateMeta.bind(this);
    this.questionListData = this.questionListData.bind(this);
    this.questionData = this.questionData.bind(this);
    this.questionSubgraph = this.questionSubgraph.bind(this);
    this.answersetData = this.answersetData.bind(this);
    this.answersetNew = this.answersetNew.bind(this);
    this.answerData = this.answerData.bind(this);

    this.enableNewAnswersets = ((config.ui !== null) && (config.ui.enableNewAnswersets !== null)) ? config.ui.enableNewAnswersets : true;
    this.enableNewQuestions = ((config.ui !== null) && (config.ui.enableNewQuestions !== null)) ? config.ui.enableNewQuestions : true;
    this.enableQuestionRefresh = ((config.ui !== null) && (config.ui.enableQuestionRefresh !== null)) ? config.ui.enableQuestionRefresh : true;
    this.enableQuestionEdit = ((config.ui !== null) && (config.ui.enableQuestionEdit !== null)) ? config.ui.enableQuestionEdit : true;
    this.enableQuestionDelete = ((config.ui !== null) && (config.ui.enableQuestionDelete !== null)) ? config.ui.enableQuestionDelete : true;
    this.enableQuestionFork = ((config.ui !== null) && (config.ui.enableQuestionFork !== null)) ? config.ui.enableQuestionFork : true;
    this.enableAnswerFeedback = ((config.ui !== null) && (config.ui.enableAnswerFeedback !== null)) ? config.ui.enableAnswerFeedback : true;

    this.colors = {
      bluegray: '#f5f7fa',
      blue: '#b8c6db',
    };

    this.styles = {
      header: {
        backgroundColor: this.colors.blue,
        backgroundImage: `linear-gradient(315deg, ${this.colors.blue} 0%, ${this.colors.bluegray} 74%)`,
      },
      jumbotron: {
        backgroundColor: this.colors.bluegray,
      },
    };
  }

  url(ext) {
    return `${this.config.protocol}://${this.config.host}:${this.config.port}/${ext}`;
  }

  landingData(fun) { this.getRequest(`${this.urls.landing}/data`, fun); }
  accountData(fun) { this.getRequest(`${this.urls.account}/data`, fun); }
  adminData(fun) { this.getRequest(`${this.urls.admin}/data`, fun); }
  questionNew(data, fun) { this.postRequest(`${this.urls.questionNew}`, data, fun, (err) => { throw err; }); }
  questionUpdateMeta(data, fun) { this.postRequest(`${this.api.questionUpdate}`, data, fun, (err) => { throw err; }); }
  questionNewData(fun) { this.getRequest(`${this.urls.questionNew}/data`, fun); }
  questionListData(fun) { this.getRequest(`${this.urls.questionList}/data`, fun); }
  questionData(id, fun) { this.getRequest(`${this.urls.question(id)}/data`, fun); }
  questionSubgraph(id, fun) { this.getRequest(`${this.urls.question(id)}/subgraph`, fun); }
  answersetData(id, fun) { this.getRequest(`${this.urls.answerset(id)}/data`, fun); }

  answersetNew(qid) { this.postRequest(`${this.urls.question(qid)}`, { command: 'answer' }, () => {}, () => {}); }
  refresh(qid) { this.postRequest(`${this.urls.question(qid)}`, { command: 'update' }, () => {}, () => {}); }
  answerData(setId, id, fun) { this.getRequest(`${this.urls.answer(setId, id)}/data`, fun); }

  open(newUrlExt) {
    window.open(this.url(newUrlExt));
  }

  questionNewSearch(postData, successFunction, failureFunction) {
    console.log('Lookup searchTerm');
  }
  questionNewValidate(postData, successFunction, failureFunction) {
    console.log('Validate the machine question here');
  }
  questionNewTranslate(postData, successFunction, failureFunction) {
    console.log('Transle the question here');
  }

  getRequest(addr, fun = () => {}) {
    this.comms.get(addr).then((result) => {
      fun(result.data); // 'ok'
    }).catch((err) => {
      window.alert('There was a problem contacting the server.');
      console.log('Problem with get request:');
      console.log(err);
    });
  }

  questionDelete(question, user, successFunction, failureFunction) {
    // Make specific post data for this action
    const data = { question_id: question.id, user: user.username };

    // Make the post request
    this.postRequest(this.api.questionDelete, data, successFunction, failureFunction);
  }

  postRequest(addr, data, successFunction = () => {}, failureFunction = () => {}) {
    this.comms.post(addr, data).then((result) => {
      successFunction(result.data);
    }).catch((err) => {
      failureFunction(err);
    });
  }

  ensureUser(user) {
    const defaultUser = {
      is_authenticated: false,
      is_active: false,
      is_anonymous: true,
      is_admin: false,
      username: 'Anonymous',
    };
    return { ...defaultUser, ...user };
  }
}

export default AppConfig;

