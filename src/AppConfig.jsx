import axios from 'axios';
import axiosRetry from 'axios-retry';

class AppConfig {
  constructor(config) {
    this.config = config;

    this.comms = axios.create();
    axiosRetry(this.comms, { retries: 3 }); // Retry for request timeouts, help with spotty connections.

    // Valid urls we would go to
    this.urls = {
      landing: this.url('landing'),
      login: this.url('login'),
      logout: this.url('logout'),
      admin: this.url('admin'),
      account: this.url('account'),
      questions: this.url('questions'),
      questionDesign: this.url('q/new'),
      question: questionId => this.url(`q/${questionId}`),
      answerset: (questionId, answersetId) => this.url(`a/${questionId}_${answersetId}`),
      answer: (questionId, answersetId, answerId) => this.url(`a/${questionId}_${answersetId}/${answerId}`),
    };

    // Other URLs that are primarily used for API calls
    this.apis = {
      user: this.url('api/user'),
      concepts: this.url('api/concepts'),
      questions: this.url('api/questions/'),
      question: questionId => this.url(`api/q/${questionId}`),
      answerset: (questionId, answersetId) => this.url(`api/a/${questionId}_${answersetId}`),
      answer: (questionId, answersetId, answerId) => this.url(`api/a/${questionId}_${answersetId}/${answerId}`),
      questionTasks: questionId => this.url(`api/q/${questionId}/tasks`),
      questionAnswer: questionId => this.url(`api/q/${questionId}/answer`),
      questionRefreshKG: questionId => this.url(`api/q/${questionId}/refresh_kg`),
      taskStatus: taskId => this.url(`api/t/${taskId}`),
      tasks: taskId => this.url(`api/tasks`),
    };

    this.url = this.url.bind(this);

    // Methods for fetching data
    this.landingData = this.landingData.bind(this);
    this.accountData = this.accountData.bind(this);
    this.adminData = this.adminData.bind(this);
    this.user = this.user.bind(this);
    this.concepts = this.concepts.bind(this);
    this.questionListData = this.questionListData.bind(this);
    this.questionData = this.questionData.bind(this);
    this.questionSubgraph = this.questionSubgraph.bind(this);
    this.answersetData = this.answersetData.bind(this);
    this.answerData = this.answerData.bind(this);

    // Question and Answer Manipulation
    this.questionCreate = this.questionCreate.bind(this);
    this.answersetCreate = this.answersetCreate.bind(this);
    this.questionUpdateMeta = this.questionUpdateMeta.bind(this);
    this.questionRefresh = this.questionRefresh.bind(this);
    this.questionFork = this.questionFork.bind(this);
    this.questionTasks = this.questionTasks.bind(this);
    this.taskStatus = this.taskStatus.bind(this);

    this.monarchSearch = this.monarchSearch.bind(this);

    // Read config parameters for enabling controls
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
  concepts(fun) { this.getRequest(`${this.apis.concepts}`, fun); }
  user(fun) { this.getRequest(`${this.apis.user}`, fun); }
  questionListData(fun) { this.getRequest(`${this.apis.questions}`, fun); }
  questionData(id, fun) { this.getRequest(`${this.apis.question(id)}`, fun); }
  questionSubgraph(id, fun) { this.getRequest(`${this.apis.question(id)}/subgraph`, fun); }
  answersetData(qid, id, fun) { this.getRequest(`${this.apis.answerset(qid, id)}`, fun); }
  answerData(qid, setId, id, fun) { this.getRequest(`${this.apis.answer(qid, setId, id)}`, fun); }

  questionCreate(data, successFun, failureFun) {
    // Data must contain a complete specification for a new question
    // This is in flux but currently matches the spec from protocop
    // const data = {
    //   name: ''
    //   natural: ''
    //   notes: ''
    //   query: {}, // Complex object matching current machine question syntax
    // };

    // To make a new question we post to the questionNew with specifications for a question
    this.postRequest(
      this.apis.questions,
      data,
      successFun,
      failureFun,
    );
  }
  answersetCreate(qid, successFun, failureFun) {
    // New answersets are triggered by a post request to the question url with
    // {command: answer}
    this.postRequest(
      this.apis.questionAnswer(qid),
      null,
      successFun,
      failureFun,
    );
  }
  questionRefresh(qid, successFun, failureFun) {
    // A knowledge graph reset is triggered by a post request to the question url with
    // {command: update}
    this.postRequest(
      this.apis.questionRefreshKG(qid),
      null,
      successFun,
      failureFun,
    );
  }
  questionFork(qid) {
    // To fork a question we make a form submission post request to the questionNew page
    // with {question_id: qid}
    // We make a form request to redirect after the post

    // Spoofing a form post request with proper headers is actualy sort of tricky
    // To do this we use some jquery to inject a form and that submit that
    // This function is a little more general purpose and could be moved and used elsewhere
    // but let's avoid that if possible.
    function formPost(path, parameters) {
      const form = $('<form></form>');

      form.attr('method', 'post');
      form.attr('action', path);

      $.each(parameters, (key, value) => {
        const field = $('<input></input>');
        field.attr('type', 'hidden');
        field.attr('name', key);
        field.attr('value', value);

        form.append(field);
      });

      // The form needs to be a part of the document in
      // order for us to be able to submit it.
      $(document.body).append(form);
      form.submit();
    }

    formPost(
      this.urls.questionDesign,
      { question_id: qid },
    );
  }
  questionTasks(qid, successFun, failureFun) {
    // Fetch active tasks for a specific question
    this.getRequest(
      this.apis.questionTasks(qid),
      successFun,
      failureFun,
    );
  }

  questionUpdateMeta(qid, data, successFun, failureFun) {
    // Data must contain all necessary meta data fields
    // Can only be done by the owner
    // const newMeta = {
    //   question_id: '' // Must match a valid question id to be updated
    //   natural_question: ''
    //   name: '',
    //   notes: '',
    // };
    this.postRequest(
      this.apis.question(qid),
      data,
      successFun,
      failureFun,
    );
  }
  questionDelete(qid, successFunction, failureFunction) {
    // Deleting a question can only be done by the owner
    
    // Make the post request
    this.deleteRequest(
      this.apis.question(qid),
      successFunction,
      failureFunction,
    );
  }

  taskStatus(taskId, successFun) {
    this.getRequest(
      this.api.taskStatus(taskId),
      successFun,
    );
  }

  answerFeedback(data, successFun, failureFun) {
    console.log("Set feedback here");
  }

  open(url) {
    window.open(url, '_blank'); // This will not open a new tab in all browsers, but will try
  }
  redirect(newUrl) {
    window.location.href = newUrl;
  }
  back() {
    window.history.back();
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

  monarchSearch(input, category) {
    // https://api.monarchinitiative.org/api/search/entity/autocomplete/ - 500s
    const addr = `https://owlsim.monarchinitiative.org/api/search/entity/autocomplete/${encodeURIComponent(input)}?start=0&rows=25&category=${encodeURIComponent(category)}`;
    // console.log(addr)
    return this.comms.get(addr).then((result) => {
      // console.log(result);
      return { options: result.data.docs.map(d => ({ value: d.id, label: d.label[0] })) };
    });
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

  postRequest(addr, data, successFunction = () => {}, failureFunction = () => {}) {
    this.comms.post(addr, data).then((result) => {
      successFunction(result.data);
    }).catch((err) => {
      failureFunction(err);
    });
  }

  deleteRequest(addr, data, successFunction = () => {}, failureFunction = () => {}) {
    this.comms.delete(addr).then((result) => {
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

