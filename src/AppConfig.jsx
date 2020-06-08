import axios from 'axios';
import axiosRetry from 'axios-retry';

class AppConfig {
  constructor(config) {
    this.config = config;

    this.comms = axios.create();
    this.questionNewSearchCancelToken = null; // Store cancelToken for get requests here (see https://github.com/axios/axios/issues/1361#issuecomment-366807250)
    axiosRetry(this.comms, { retries: 3 }); // Retry for request timeouts, help with spotty connections.
    this.cancelToken = axios.CancelToken.source();

    // Valid urls we would go to
    this.urls = {
      landing: this.url('landing'),
      login: this.url('login'),
      logout: this.url('logout'),
      questions: this.url('questions/'),
      questionDesign: this.url('q/new/'),
      question: questionId => this.url(`q/${questionId}/`),
      answerset: (questionId, answersetId) => this.url(`a/${questionId}_${answersetId}/`),
      answer: (questionId, answersetId, answerId) => this.url(`a/${questionId}_${answersetId}/${answerId}/`),
      help: this.url('help/'),
      about: this.url('about/'),
      guide: this.url('guide/'),
      apps: this.url('apps/'),
      alpha: this.url('alpha/'),
      search: this.url('search/'),
      view: this.url('simple/view/'),
      simpleQuestion: this.url('simple/question/'),
      enrich: this.url('simple/enriched'),
      similarity: this.url('simple/similarity'),
      expand: this.url('simple/expand'),
      synonymize: this.url('simple/synonymize'),
      publications: this.url('simple/publications'),
      termsofservice: this.url('termsofservice'),
    };

    // Other URLs that are primarily used for API calls
    this.apis = {
      user: this.url('api/user/'), // GET current user credentials
      licenses: this.url('api/licenses/'), // GET source licenses
      concepts: this.url('api/concepts/'), // GET concepts contained in the global potential KG
      predicates: this.url('api/predicates/'), // GET predicates for edges
      nodeProperties: this.url('api/node_properties/'), // GET valid node properties
      operations: this.url('api/operations/'), // GET operations contained in global potential KG
      questions: this.url('api/questions/'), // POST to store a new question
      // POST to update meta data, DELETE to delete the question
      question: questionId => this.url(`api/q/${questionId}/`),
      // POST to initiate creation of a new answer set
      questionAnswer: questionId => this.url(`api/q/${questionId}/answer/`),
      // POST to initiate an update of the KG for this question
      questionRefreshKG: questionId => this.url(`api/q/${questionId}/refresh_kg/`),
      // POST to change question visibility
      questionVisibility: (questionId, visibility) => this.url(`api/q/${questionId}/visibility/?visibility=${visibility}`),
      simpleQuick: this.url('api/simple/quick/'), // POST to answer question without caching
      answersetData: qid_aid => this.url(`api/a/${qid_aid}/?include_kg=true`), // GET complete message
      parse: this.url('api/nlp/'),
      task: taskId => this.url(`api/t/${taskId}/`), // DELETE or GET status
      taskLog: taskId => this.url(`api/t/${taskId}/log/`), // GET detailed log of ongoing or completed task
      feedbackNew: this.url('api/feedback/'), // POST new feedback
      feedback: (questionId, answersetId) => this.url(`api/a/${questionId}_${answersetId}/feedback/`),
      search: this.url('api/search/'), // POST for Bionames search
      rankedPredicates: this.url('api/count_predicates/'), // POST to ranker for valid predicates
      viewData: id => this.url(`api/simple/view/${id}/`),
      simpleEnriched: (type1, type2) => this.url(`api/simple/enriched/${type1}/${type2}/`), // POST for simple enriched
      simpleSimilarity: (type1, type2, id, simType, threshold, maxResults) => (
        this.url(`api/simple/similarity/${type1}/${id}/${type2}/${simType}?threshhold=${threshold}&max_results=${maxResults}`)
      ), // Get for simple similarity
      simpleExpand: (type1, type2, id, predicate, direction, maxConnect, maxResults) => (
        this.url(`api/simple/expand/${type1}/${id}/${type2}?predicate=${predicate}&direction=${direction}&max_connectivity=${maxConnect}&max_results=${maxResults}`)
      ), // Get for simple expand
      simpleSynonymize: (id, type) => this.url(`api/simple/synonymize/${id}/${type}/`), // POST for synonyms of curie from Builder API
      graphql: `${this.config.protocol}://${this.config.host}:${this.config.graphqlPort}/graphql`,
      publications: (id1, id2) => this.url(`api/omnicorp/${id1}/${id2}/`), // GET publications for one identifier or a pair of identifiers
      publication: id => this.url(`api/omnicorp/${id}/`), // Get publications for one identifier
      pubmedPublications: id => this.url(`api/pubmed/${id}/`), // GET pubmed publications for given id
      details: id => this.url(`api/details/${id}/`), // GET urls for specified node
      neighborhood: id => this.url(`api/neighborhood/${id}/`), // GET all one-hop neighbor nodes
    };

    this.url = this.url.bind(this);

    // Methods for fetching data
    this.user = this.user.bind(this);
    this.concepts = this.concepts.bind(this);
    this.operations = this.operations.bind(this);
    this.answersetData = this.answersetData.bind(this);

    // Question and Answer Manipulation
    this.questionCreate = this.questionCreate.bind(this);
    this.answersetCreate = this.answersetCreate.bind(this);
    this.questionData = this.questionData.bind(this);
    this.questionUpdateMeta = this.questionUpdateMeta.bind(this);
    this.questionRefresh = this.questionRefresh.bind(this);
    this.questionFork = this.questionFork.bind(this);
    this.questionTasks = this.questionTasks.bind(this);
    this.questionList = this.questionList.bind(this);
    this.taskStatus = this.taskStatus.bind(this);
    this.taskLog = this.taskLog.bind(this);
    this.taskStop = this.taskStop.bind(this);

    this.questionNewTranslate = this.questionNewTranslate.bind(this);
    this.questionNewSearch = this.questionNewSearch.bind(this);
    this.viewData = this.viewData.bind(this);
    this.getPublications = this.getPublications.bind(this);

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

  concepts(fun, fail = () => {}) { this.getRequest(`${this.apis.concepts}`, fun, fail); }
  operations(fun) { this.getRequest(`${this.apis.operations}`, fun); }
  user(successFun, failureFun) { this.getRequest(`${this.apis.user}`, successFun, failureFun); }
  licenses(successFun, failureFun) { this.getRequest(`${this.apis.licenses}`, successFun, failureFun); }
  predicates(successFun, failureFun) { this.getRequest(`${this.apis.predicates}`, successFun, failureFun); }
  nodeProperties(successFun, failureFun) { this.getRequest(`${this.apis.nodeProperties}`, successFun, failureFun); }
  answersetData(qid_aid, successFun, failureFun) { this.getRequest(`${this.apis.answersetData(qid_aid)}`, successFun, failureFun); }

  questionData(qid, successFun, failureFun) {
    const query = `{
      question: questionById(id: "${qid}") {
        id
        ownerId
        natural_question: naturalQuestion
        notes
        visibility
        machine_question: qgraphByQgraphId {
          body
        }
        tasks: tasksByQuestionIdList {
          id
          initiator
          timestamp
          startingTimestamp
          endTimestamp
          result
          type
        }
        question_graph: qgraphByQgraphId {
          answersets: answersetsByQgraphIdList {
            id
            timestamp
          } 
        }
      }
    }`;
    this.postRequest(this.apis.graphql, { query }, successFun, failureFun);
  }
  questionList(successFun, failureFun) {
    this.user((data) => {
      const user = this.ensureUser(data);
      // guest users have user_id = null
      // but we need it to be an int
      if (user.user_id === null) {
        user.user_id = -1;
      }
      const query = `{
        questions: allQuestionsList (filter: {or: [
          {ownerId: {equalTo: ${user.user_id}}}
          {visibility: {equalTo: PUBLIC}}
          {visibility: {equalTo: PROMOTED}}
        ]}) {
          id
          naturalQuestion
          ownerId
          notes
          timestamp
          tasks: tasksByQuestionIdList {
            id
            initiator
            timestamp
            startingTimestamp
            endTimestamp
            result
            type
          }
          qgraphs: qgraphByQgraphId {
            answersets: answersetsByQgraphIdList {
              id
              timestamp
            }
          }
        }
      }`;
      this.postRequest(this.apis.graphql, { query }, successFun, failureFun);
    });
  }
  promotedQuestions(successFun, failureFun) {
    const query = `{
      questions: allQuestionsList (filter: {visibility: {equalTo: PROMOTED}}) {
        id
        naturalQuestion
        ownerId
        notes
        timestamp
        qgraphs: qgraphByQgraphId {
          answersets: answersetsByQgraphIdList {
            id
            timestamp
          }
        }
      }
    }`;
    this.postRequest(this.apis.graphql, { query }, successFun, failureFun);
  }
  questionVisibility(questionId, visibility, callback, failureFunc) {
    this.postRequest(
      this.apis.questionVisibility(questionId, visibility),
      {},
      callback,
      failureFunc,
    );
  }
  questionCreate(data, successFun, failureFun) {
    // Data must contain a complete specification for a new question
    // To make a new question we post to the questions page with specifications for a question
    this.postRequest(
      this.apis.questions,
      data,
      successFun,
      failureFun,
    );
  }
  answersetCreate(qid, successFun, failureFun) {
    // New answersets are triggered by a post request to the question url /answer
    this.postRequest(
      this.apis.questionAnswer(qid),
      null,
      successFun,
      failureFun,
    );
  }
  questionRefresh(qid, successFun, failureFun) {
    // A knowledge graph reset is triggered by a post request to the question url /refresh_kg
    this.postRequest(
      this.apis.questionRefreshKG(qid),
      null,
      successFun,
      failureFun,
    );
  }
  questionTasks(qid, successFun, failureFun) {
    const query = `{
      question: questionById(id: "${qid}"){
        tasks: tasksByQuestionIdList {
          id
          timestamp
          startingTimestamp
          endTimestamp
          result
          remoteTaskId
          type
        }
      }
    }`;
    this.postRequest(this.apis.graphql, { query }, successFun, failureFun);
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
      const form = document.createElement('FORM');

      form.method = 'POST';
      form.action = path;

      Object.entries(parameters).forEach((keyVal) => {
        const field = document.createElement('INPUT');
        field.type = 'HIDDEN';
        [field.name] = keyVal;
        [, field.value] = keyVal;

        form.appendChild(field);
      });

      // The form needs to be a part of the document in
      // order for us to be able to submit it.
      document.body.appendChild(form);
      form.submit();
    }

    formPost(
      this.urls.questionDesign,
      { question_id: qid },
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
  taskLog(taskId, successFun) {
    this.getRequest(
      this.apis.taskLog(taskId),
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
  viewData(uploadId, successFun, failureFun) {
    this.getRequest(
      this.apis.viewData(uploadId),
      successFun,
      failureFun,
    );
  }
  simpleQuick(body, successFun, failureFun) {
    this.postRequest(
      this.apis.simpleQuick,
      body,
      successFun,
      failureFun,
    );
  }
  simpleEnriched(type1, type2, body, successFun, failureFun) {
    this.postRequest(
      this.apis.simpleEnriched(type1, type2),
      body,
      successFun,
      failureFun,
    );
  }
  simpleSimilarity(type1, type2, id, simType, threshold, maxResults, successFun, failureFun) {
    this.getRequest(
      this.apis.simpleSimilarity(type1, type2, id, simType, threshold, maxResults),
      successFun,
      failureFun,
    );
  }
  simpleExpand(type1, type2, id, predicate, direction, maxConnect, maxResults, successFun, failureFun) {
    this.getRequest(
      this.apis.simpleExpand(type1, type2, id, predicate, direction, maxConnect, maxResults),
      successFun,
      failureFun,
    );
  }
  simpleSynonymize(id, type, successFun, failureFun) {
    this.getRequest(
      this.apis.simpleSynonymize(id, type),
      successFun,
      failureFun,
    );
  }
  getPublications(id1, id2, successFun, failureFun) {
    this.getRequest(
      this.apis.publications(id1, id2),
      successFun,
      failureFun,
    );
  }
  getPublication(id, successFun, failureFun) {
    this.getRequest(
      this.apis.publication(id),
      successFun,
      failureFun,
    );
  }
  getPubmedPublications(id, successFun, failureFun) {
    this.getRequest(
      this.apis.pubmedPublications(id),
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
    window.history.replaceState({}, title, url);
  }

  questionNewTranslate(questionText, successFunction, failureFunction) {
    this.postRequest(
      this.apis.parse,
      `"${questionText}"`,
      successFunction,
      failureFunction,
    );
  }

  details(curie, success, failure) {
    const url = this.apis.details(curie);
    this.getRequest(
      url,
      success,
      failure,
    );
  }

  neighborhood(curie, success, failure) {
    const url = this.apis.neighborhood(curie);
    this.getRequest(
      url,
      success,
      failure,
    );
  }

  getRankedPredicates(nodes, cancelToken, cancel) {
    if (cancel) {
      cancelToken.cancel();
    }
    const url = this.apis.rankedPredicates;
    return this.comms.post(url, nodes, { cancelToken: cancelToken.token })
      .then(
        res => res,
        (thrown) => {
          if (axios.isCancel(thrown)) {
            // console.log('ranked predicates cancelled', thrown);
          }
          return { data: {} };
        },
      )
      .catch((err) => {
        console.log('ranked predicates error', err);
        return {};
      });
  }

  // Requests curie from bionames and returns an object of form
  // { options: [{ value, label }, ...] }. Returned object is an
  // empty object {} if request is cancelled
  questionNewSearch(input, nodeType) {
    if (this.questionNewSearchCancelToken) {
      this.questionNewSearchCancelToken.cancel();
    }
    // Inclusion of direct identifiers bypasses API lookup
    if (input.includes(':')) {
      return Promise.resolve({ options: [{ value: input, label: input, type: nodeType }] });
    }
    const searchTerm = input.replace(/[\W_]+/g, ' ');
    this.questionNewSearchCancelToken = axios.CancelToken.source();

    const url = nodeType ? `${this.apis.search}${nodeType}/` : this.apis.search;
    // Because this method is called by react-select Async we must return a promise that will return the values
    return this.comms.post(url, searchTerm, { cancelToken: this.questionNewSearchCancelToken.token }).then((result) => {
      const options = result.data.map(d => ({ ...d, value: d.curie, label: d.name }));
      return { options };
    }, (thrown) => {
      if (axios.isCancel(thrown)) {
        // console.log('questionNewSearch Request canceled', thrown.message);
        return Promise.resolve({ cancelled: true });
      }
      return Promise.resolve({ options: [] });
    });
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
    this.comms.get(addr, { cancelToken: this.cancelToken.token }).then((result) => {
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
      user_id: '',
    };
    return { ...defaultUser, ...user };
  }
}

export default AppConfig;

