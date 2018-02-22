class AppConfig {
  constructor(config) {
    this.config = config;

    this.urls = {
      landing: this.url('landing'),
      landingData: this.url('landing/data'),
      login: this.url('login'),
      logout: this.url('logout'),
      account: this.url('account'),
      accountData: this.url('account/data'),
      questionList: this.url('questions'),
      questionListData: this.url('questions/data'),
      questionNew: this.url('q/new'),
      questionNewData: this.url('q/new/data'),
      question: questionId => this.url(`q/${questionId}`),
      questionData: questionId => this.url(`q/${questionId}/data`),
      answerset: answersetId => this.url(`a/${answersetId}`),
      answersetData: answersetId => this.url(`a/${answersetId}/data`),
      answer: (answersetId, answerId) => this.url(`a/${answersetId}/${answerId}`),
      answerData: (answersetId, answerId) => this.url(`a/${answersetId}/${answerId}/data`),
    };

    this.urls.question = this.urls.question.bind(this);
    this.urls.questionData = this.urls.questionData.bind(this);
    this.urls.answerset = this.urls.answerset.bind(this);
    this.urls.answersetData = this.urls.answersetData.bind(this);
    this.urls.answer = this.urls.answer.bind(this);
    this.urls.answerData = this.urls.answerData.bind(this);

    this.url = this.url.bind(this);
    this.landingData = this.landingData.bind(this);
    this.accountData = this.accountData.bind(this);
    this.adminData = this.adminData.bind(this);
    this.questionNewData = this.questionNewData.bind(this);
    this.questionListData = this.questionListData.bind(this);
    this.questionData = this.questionData.bind(this);
    this.answersetData = this.answersetData.bind(this);
    this.answerData = this.answerData.bind(this);
  }

  url(ext) {
    return `${this.config.protocol}://${this.config.clientHost}:${this.config.port}/${ext}`;
  }

  landingData(fun) { this.getRequest(this.urls.landingData, fun); }
  accountData(fun) { this.getRequest(this.urls.accountData, fun); }
  adminData(fun) { this.getRequest(this.urls.adminData, fun); }
  questionNewData(fun) { this.getRequest(this.urls.questionNewData, fun); }
  questionListData(fun) { this.getRequest(this.urls.questionListData, fun); }
  questionData(id, fun) { this.getRequest(this.urls.questionData(id), fun); }
  answersetData(id, fun) { this.getRequest(this.urls.answersetData(id), fun); }
  answerData(setId, id, fun) { this.getRequest(this.urls.answerData(setId, id), fun); }

  getRequest(addr, fun) {
    $.get(addr, data => fun(data)).fail((err) => {
      console.log('Problem loading the page.');
      console.log(err);
      // To do: retries and then forward to 404
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

