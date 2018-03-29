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
      questionList: this.url('questions'),
      questionNew: this.url('q/new'),
      question: questionId => this.url(`q/${questionId}`),
      answerset: answersetId => this.url(`a/${answersetId}`),
      answer: (answersetId, answerId) => this.url(`a/${answersetId}/${answerId}`),
    };

    // Some are functions that we must bind
    this.urls.question = this.urls.question.bind(this);
    this.urls.answerset = this.urls.answerset.bind(this);
    this.urls.answer = this.urls.answer.bind(this);

    // Other URLs that are primarily used for API calls
    this.api = {
      questionUpdate: this.url('q/edit'),
      questionDelete: this.url('q/delete'),
    };

    this.url = this.url.bind(this);

    // Methods for fetching data
    this.landingData = this.landingData.bind(this);
    this.accountData = this.accountData.bind(this);
    this.adminData = this.adminData.bind(this);
    this.questionNewData = this.questionNewData.bind(this);
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
    this.questionDelete = this.questionDelete.bind(this);
    

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
  questionListData(fun) { this.getRequest(`${this.urls.questionList}/data`, fun); }
  questionData(id, fun) { this.getRequest(`${this.urls.question(id)}/data`, fun); }
  questionSubgraph(id, fun) { this.getRequest(`${this.urls.question(id)}/subgraph`, fun); }
  questionNewData(qid, fun) { this.postRequest(`${this.urls.questionNew}/data`, { question_id: qid }, fun, (err) => { throw err; }); }
  answersetData(id, fun) { this.getRequest(`${this.urls.answerset(id)}/data`, fun); }
  answerData(setId, id, fun) { this.getRequest(`${this.urls.answer(setId, id)}/data`, fun); }

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
      this.urls.questionNew,
      data,
      successFun,
      failureFun,
    );
  }
  answersetCreate(qid, successFun, failureFun) {
    // New answersets are triggered by a post request to the question url with
    // {command: answer}
    this.postRequest(
      this.urls.question(qid),
      { command: 'answer' },
      successFun,
      failureFun,
    );
  }
  questionRefresh(qid, successFun, failureFun) {
    // A knowledge graph reset is triggered by a post request to the question url with
    // {command: update}
    this.postRequest(
      this.urls.question(qid),
      { command: 'update' },
      successFun,
      failureFun,
    );
  }
  questionFork(qid) {
    // To fork a question we make a form post request to the questionNew page
    // with {question_id: qid}
    // We make a form request to redirect after the post
    console.log("Fork here" + qid)
    // var bodyFormData = new FormData();
    // this.comms.post(
    //   `${this.urls.questionNew}`,
    //   {question_id: qid},
    //   {'Content-Type': 'application/json'}
    // ); }

    // <form action={this.props.questionNewUrl} method="post" class="add-entry">
    //   <input type="submit" name="question_id" value={this.props.question.id} />
    // </form>
  }

  questionUpdateMeta(data, successFun, failureFun) {
    // Data must contain all necessary meta data fields
    // Can only be done by the owner
    // const newMeta = {
    //   question_id: '' // Must match a valid question id to be updated
    //   natural_question: ''
    //   name: '',
    //   notes: '',
    // };
    this.postRequest(
      this.api.questionUpdate,
      data,
      successFun,
      failureFun,
    );
  }
  questionDelete(qid, successFunction, failureFunction) {
    // Deleting a question can only be done by the owner
    const data = { question_id: qid };

    // Make the post request
    this.postRequest(
      this.api.questionDelete,
      data,
      successFunction,
      failureFunction,
    );
  }

  // open(newUrlExt) {
  //   window.open(this.url(newUrlExt));
  // }
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

