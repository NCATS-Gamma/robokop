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
      questions: this.url('questions'),
      questionDesign: this.url('q/new/'),
      question: questionId => this.url(`q/${questionId}`),
      answerset: (questionId, answersetId) => this.url(`a/${questionId}_${answersetId}`),
      answer: (questionId, answersetId, answerId) => this.url(`a/${questionId}_${answersetId}/${answerId}`),
      about: this.url('about/'),
      workflow: this.url('workflow/'),
      appAnswerset: this.url('app/answerset'),
      appComparison: this.url('app/comparison'),
    };

    // Other URLs that are primarily used for API calls
    this.apis = {
      user: this.url('api/user/'),
      concepts: this.url('api/concepts/'),
      questions: this.url('api/questions/'),
      question: questionId => this.url(`api/q/${questionId}/`),
      answerset: answersetId => this.url(`api/a/${answersetId}/`),
      answer: (answersetId, answerId) => this.url(`api/a/${answersetId}/${answerId}/`),
      questionTasks: questionId => this.url(`api/q/${questionId}/tasks/`),
      questionAnswer: questionId => this.url(`api/q/${questionId}/answer/`),
      questionRefreshKG: questionId => this.url(`api/q/${questionId}/refresh_kg/`),
      parse: this.url('api/nlp/'),
      tasks: this.url('api/tasks'),
      task: taskId => this.url(`api/t/${taskId}/`),
      feedbackNew: this.url('api/feedback/'),
      feedback: (questionId, answersetId) => this.url(`api/a/${questionId}_${answersetId}/feedback`),
      search: this.url('api/search/'),
    };

    this.url = this.url.bind(this);

    // Methods for fetching data
    this.user = this.user.bind(this);
    this.concepts = this.concepts.bind(this);
    this.questionListData = this.questionListData.bind(this);
    this.questionData = this.questionData.bind(this);
    this.questionSubgraph = this.questionSubgraph.bind(this);
    this.answersetData = this.answersetData.bind(this);
    this.answerData = this.answerData.bind(this);
    this.tasksData = this.tasksData.bind(this);

    // Question and Answer Manipulation
    this.questionCreate = this.questionCreate.bind(this);
    this.answersetCreate = this.answersetCreate.bind(this);
    this.questionUpdateMeta = this.questionUpdateMeta.bind(this);
    this.questionRefresh = this.questionRefresh.bind(this);
    this.questionFork = this.questionFork.bind(this);
    this.questionTasks = this.questionTasks.bind(this);
    this.taskStatus = this.taskStatus.bind(this);
    this.taskStop = this.taskStop.bind(this);

    this.questionNewValidate = this.questionNewValidate.bind(this);
    this.questionNewTranslate = this.questionNewTranslate.bind(this);
    this.questionNewSearch = this.questionNewSearch.bind(this);

    this.externalTemplateRequestIndigo = this.externalTemplateRequestIndigo.bind(this);
    this.externalTemplateRequestXray = this.externalTemplateRequestXray.bind(this);
    this.externalTemplateRequestGamma = this.externalTemplateRequestGamma.bind(this);

    // Read config parameters for enabling controls
    this.enableNewAnswersets = ((config.ui !== null) && (config.ui.enableNewAnswersets !== null)) ? config.ui.enableNewAnswersets : true;
    this.enableNewQuestions = ((config.ui !== null) && (config.ui.enableNewQuestions !== null)) ? config.ui.enableNewQuestions : true;
    this.enableQuestionRefresh = ((config.ui !== null) && (config.ui.enableQuestionRefresh !== null)) ? config.ui.enableQuestionRefresh : true;
    this.enableQuestionEdit = ((config.ui !== null) && (config.ui.enableQuestionEdit !== null)) ? config.ui.enableQuestionEdit : true;
    this.enableQuestionDelete = ((config.ui !== null) && (config.ui.enableQuestionDelete !== null)) ? config.ui.enableQuestionDelete : true;
    this.enableQuestionFork = ((config.ui !== null) && (config.ui.enableQuestionFork !== null)) ? config.ui.enableQuestionFork : true;
    this.enableTaskStatus = ((config.ui !== null) && (config.ui.enableTaskStatus !== null)) ? config.ui.enableTaskStatus : true;
    this.enableAnswerFeedback = ((config.ui !== null) && (config.ui.enableAnswerFeedback !== null)) ? config.ui.enableAnswerFeedback : true;

    this.colors = {
      bluegray: '#f5f7fa',
      blue: '#b8c6db',
    };
  }

  url(ext) {
    return `${this.config.protocol}://${this.config.host}:${this.config.port}/${ext}`;
  }

  concepts(fun) { this.getRequest(`${this.apis.concepts}`, fun); }
  user(successFun, failureFun) { this.getRequest(`${this.apis.user}`, successFun, failureFun); }
  questionListData(fun) { this.getRequest(`${this.apis.questions}`, fun); }
  questionData(id, successFun, failureFun) { this.getRequest(`${this.apis.question(id)}`, successFun, failureFun); }
  questionSubgraph(id, successFun, failureFun) { this.getRequest(`${this.apis.question(id)}subgraph/`, successFun, failureFun); }
  answersetData(id, successFun, failureFun) { this.getRequest(`${this.apis.answerset(id)}`, successFun, failureFun); }
  answerData(setId, id, successFun, failureFun) { this.getRequest(`${this.apis.answer(setId, id)}`, successFun, failureFun); }

  questionCreate(data, successFun, failureFun) {
    // Data must contain a complete specification for a new question
    // This is in flux but currently matches the spec from protocop
    // const data = {
    //   name: ''
    //   natural: ''
    //   notes: ''
    //   query: {}, // Complex object matching current machine question syntax
    // };

    // To make a new question we post to the questions page with specifications for a question
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
    // To do this we use some jquery to inject a form and then submit that
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
    // Make the delete request
    this.deleteRequest(
      this.apis.question(qid),
      successFunction,
      failureFunction,
    );
  }

  taskStatus(taskId, successFun) {
    this.getRequest(
      this.apis.task(taskId),
      successFun,
    );
  }
  tasksData(successFun) {
    this.getRequest(
      this.apis.tasks,
      successFun,
    );
  }
  taskStop(taskId, successFun, failureFun) {
    this.deleteRequest(
      this.apis.task(taskId),
      successFun,
      failureFun,
    );
  }

  answerFeedbackNew(data, successFun, failureFun) {
    this.postRequest(
      this.apis.feedbackNew,
      data,
      successFun,
      failureFun,
    );
  }
  answerFeedback(questionId, answersetId, successFun, failureFun) {
    this.getRequest(
      this.apis.feedback(questionId, answersetId),
      successFun,
      failureFun,
    );
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
  replaceUrl(title, url) {
    history.replaceState({}, title, url);
  }
  // setUrl(title, url) {
  //   history.pushState({}, title, url);
  // }

  questionNewValidate(postData, successFunction, failureFunction) {
    console.log('Validate the machine question here');
  }
  questionNewTranslate(questionText, successFunction, failureFunction) {
    this.postRequest(
      this.apis.parse,
      `"${questionText}"`,
      successFunction,
      failureFunction,
    );
  }

  questionNewSearch(input, category) {
    const addr = `${this.apis.search}${encodeURIComponent(input)}/${encodeURIComponent(category)}`;
    // Because this method is called by react-select Async we must return a promise that will return the values
    return this.comms.get(addr).then((result) => {
      const options = result.data.map(d => ({ value: d.id, label: d.label }));

      // Allow the inclusion of direct identifiers incase the search doesn't have what you want.
      if (input.includes(':')) {
        options.push({ value: input, label: input });
      }
      return { options };
    }, () => {
      // Allow the inclusion of direct identifiers in case the search fails you
      if (input.includes(':')) {
        return Promise.resolve({ options: [{ value: input, label: input }] });
      }
      return Promise.resolve({ options: [] });
    });
  }
  // submitRequest(url, data) {
  //   http.open("POST", url, true);
  //   http.setRequestHeader("Content-type", "application/json");
  //   http.setRequestHeader("Accept", "application/json");
  //   http.send(JSON.stringify(request));
  // }
  externalTemplateRequestGamma(queryId, terms, successFun, failureFun) {
    const url = 'http://robokop.renci.org:6011/api/query';
    const postData = {
      query_type_id: queryId,
      terms,
    };

    return this.postRequest(url, postData, successFun, failureFun);
  }
  externalTemplateRequestIndigo(queryId, terms, successFun, failureFun) {
    const url = 'https://indigo.ncats.io/reasoner/api/v0/query';
    const postData = {
      query_type_id: queryId,
      terms,
    };

    this.postRequest(url, postData, successFun, failureFun);
  }
  externalTemplateRequestXray(queryId, terms, successFun, failureFun) {
    const url = 'https://rtx.ncats.io/api/rtx/v1/query';
    const termsFixed = { ...terms, 
      rel_type: "directly_interacts_with",
      target_label: "protein" };
    if ('chemical_substance' in termsFixed) {
      let chem = termsFixed.chemical_substance;
      [, chem] = chem.split(':');
      termsFixed.chemical_substance = chem;
    }

    const postData = {
      known_query_type_id: queryId,
      terms: termsFixed,
    };
    this.postRequest(url, postData, successFun, failureFun);
  }

  getRequest(
    addr,
    successFunction = () => {},
    failureFunction = (err) => {
      window.alert('There was a problem contacting the server.');
      console.log('Problem with get request:');
      console.log(err);
    },
  ) {
    this.comms.get(addr).then((result) => {
      successFunction(result.data); // 'ok'
    }).catch((err) => {
      failureFunction(err);
    });
  }

  postRequest(
    addr,
    data,
    successFunction = () => {},
    failureFunction = (err) => {
      window.alert('There was a problem contacting the server.');
      console.log('Problem with post request:');
      console.log(err);
    },
  ) {
    this.comms.post(addr, data).then((result) => {
      successFunction(result.data);
    }).catch((err) => {
      failureFunction(err);
    });
  }

  deleteRequest(
    addr,
    successFunction = () => {},
    failureFunction = (err) => {
      window.alert('There was a problem contacting the server.');
      console.log('Problem with delete request:');
      console.log(err);
    },
  ) {
    this.comms.delete(addr).then((result) => {
      successFunction(result);
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

