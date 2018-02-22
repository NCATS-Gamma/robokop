class appConfig {
  constructor(config){
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
      question: (question_id) => this.url(`q/${question_id}`),
      questionData: (question_id) => this.url(`q/${question_id}/data`),
      answerset: (answerset_id) => this.url(`a/${answerset_id}`),
      answersetData: (answerset_id) => this.url(`a/${answerset_id}/data`),
      answer: (answerset_id, answer_id) => this.url(`a/${answerset_id}/${answer_id}`),
      answerData: (answerset_id, answer_id) => this.url(`a/${answerset_id}/${answer_id}/data`),
    }
  }
  
  getRequest(addr, fun){
    $.get(addr, (data) => fun(data)).fail((err) => {
      console.log('Problem loading the page.');
      console.log(err);
      // To do: retries and then forward to 404
    });
  }

  url(ext) {
    return `${this.config.protocol }://${this.config.clientHost}:${this.config.port}/${ext}`;
  }

  landingData(fun){ this.getRequest(this.urls.landingData, fun); };
  accountData(fun){ this.getRequest(this.urls.accountData, fun); };
  adminData(fun){ this.getRequest(this.urls.adminData, fun); };
  questionNewData(fun){ this.getRequest(this.urls.questionNewData, fun); };
  questionListData(fun){ this.getRequest(this.urls.questionListData, fun); };
  questionData(id, fun){ this.getRequest(this.urls.questionData(id), fun); };
  answersetData(id, fun){ this.getRequest(this.urls.answersetData(id), fun); };
  answerData(setId, id, fun){ this.getRequest(this.urls.answerData(setId, id), fun); };

  ensureUser(user) {
    const defaultUser = {is_authenticated: false,
                         is_active: false,
                         is_anonymous: true,
                         is_admin: false,
                         username: 'Anonymous'};
    return {...defaultUser, ...user}
  }
}

export default appConfig;

