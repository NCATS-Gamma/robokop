class appConfig {
  constructor(config){
    this.config = config;
  }
  
  getRequest(ext, fun){
    $.get(this.url(ext), (data) => fun(data)).fail((err) => {
      console.log('Problem loading the page.');
      console.log(err);
      // To do: retries and then forward to 404
    });
  }

  url(ext) {
    return `${this.config.protocol }://${this.config.clientHost}:${this.config.port}/${ext}`;
  }

  landingData(fun){ this.getRequest('landing/data',fun); };
  accountData(fun){ this.getRequest('account/data',fun); };
  adminData(fun){ this.getRequest('admin/data',fun); };
  newData(fun){ this.getRequest('new/data',fun); };
  questionListData(fun){ this.getRequest('questions/data',fun); };
  questionData(id, fun){ this.getRequest(`q/${id}/data`,fun); };
  answerSetData(id, fun){ this.getRequest(`a/${id}/data`,fun); };

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

