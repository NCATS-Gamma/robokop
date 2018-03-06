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
      questionUpdate: this.url('q/edit'),
      questionDelete: this.url('q/delete'),
      questionFork: this.url('q/fork'),
    };

    this.url = this.url.bind(this);

    this.landingData = this.landingData.bind(this);
    this.accountData = this.accountData.bind(this);
    this.adminData = this.adminData.bind(this);
    this.questionNewData = this.questionNewData.bind(this);
    this.questionListData = this.questionListData.bind(this);
    this.questionData = this.questionData.bind(this);
    this.questionSubgraph = this.questionSubgraph.bind(this);
    this.answersetData = this.answersetData.bind(this);
    this.answersetNew = this.answersetNew.bind(this);
    this.answerData = this.answerData.bind(this);
  }

  url(ext) {
    return `${this.config.protocol}://${this.config.clientHost}:${this.config.port}/${ext}`;
  }

  landingData(fun) { this.getRequest(`${this.urls.landing}/data`, fun); }
  accountData(fun) { this.getRequest(`${this.urls.account}/data`, fun); }
  adminData(fun) { this.getRequest(`${this.urls.admin}/data`, fun); }
  questionNewData(fun) { this.getRequest(`${this.urls.questionNew}/data`, fun); }
  questionListData(fun) { this.getRequest(`${this.urls.questionList}/data`, fun); }
  questionData(id, fun) { this.getRequest(`${this.urls.question(id)}/data`, fun); }
  questionSubgraph(id, fun) { this.getRequest(`${this.urls.question(id)}/subgraph`, fun); }
  answersetData(id, fun) { this.getRequest(`${this.urls.answerset(id)}/data`, fun); }
  answersetNew(qid) { this.postRequest(`${this.urls.question(qid)}/go`, null, function(){}, function(){}); }
  updateKG(qid) { this.postRequest(`${this.urls.question(qid)}/update`, null, function(){}, function(){}); }
  answerData(setId, id, fun) { this.getRequest(`${this.urls.answer(setId, id)}/data`, fun); }

  getRequest(addr, fun) {
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

  postRequest(addr, data, successFunction, failureFunction) {
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

