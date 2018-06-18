class ProcessSequence {
  constructor() {
    this.processors = [new Processor()]; // Array of workFlowProcessor's
    this.outputs = [];
  }

  run() {

  }
  runOneAndPropagate(index) {
    if (this.processors.length < (index + 1)) {
      return new Error('Invalid index');
    }
    const output = this.processors[index].run();
    this.processors[index + 1].set
    for (let iProc = 0; iProc < this.processors.length; iProc += 1) {
      procOutput = this.processors[iProc].run(procOutput);
    }
    return procOutput;
  }
}

class Processor {
  constructor() {
    this.input = [];
    this.connection = [];
    this.queryId = 'Q3';
    this.answerset = [];
    this.answer = [];
    this.exporter = (d) => d;
  }

  export() {
    this.exportList();
  }
  exportList() {
    return this.map(this.exporter);
  }

  process() {
    const url = 'http://robokop.renci.org:6011/api/query';
    const postData = {
      query_type_id: this.queryId,
      terms: this.input,
    };

    return this.postRequest(url, postData, successFun, failureFun);
  }

  run(inWork) {
    // Input work

    return outWork;
  }
}

class Work {
  constructor() {
    this.type = 'list';
    this.data = [];
  }
}

// export default {workflow, workflowProcessor, work, workflowProcessorTemplateRequest}