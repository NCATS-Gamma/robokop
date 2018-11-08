import { observable, action, computed, configure, runInAction } from 'mobx';
import Fuse from 'fuse-js-latest';

// import entityNameDisplay from '../components/util/entityNameDisplay';
// import AppConfig from '../AppConfig';

// const config = require('../../config.json');
const _ = require('lodash');


configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

class AnswersetStore {
    fuseOptions = {
      // shouldSort: true,
      tokenize: true,
      matchAllTokens: false,
      findAllMatches: true,
      threshold: 0,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['names'],
    };
    answers = []; // Answer list supplied to store on init
    @observable updateSelectedSubGraphIndexCallback = () => {};
    @observable filterText = '';
    @observable selectedSubGraphIndex = 0;

    constructor(ans) {
      this.answers = ans;
    }
    @computed get answersWithInds() { // eslint-disable-line react/sort-comp
      const answers = _.cloneDeep(this.answers);
      answers.forEach((ans, i) => (ans.ans_ind = i));
      return answers;
    }
    @computed get answersAsFuseList() {
      return this.answersWithInds.map(ans => ({ ans_ind: ans.ans_ind, names: ans.result_graph.node_list.map(n => n.name) }));
    }
    @computed get fuse() {
      return new Fuse(this.answersAsFuseList, this.fuseOptions);
    }
    @computed get filteredAnswers() { // eslint-disable-line react/sort-comp
      if (this.filterText === '') { // Return all answers if filterText is blank
        return this.answersWithInds;
      }
      const filtFuseResultInds = this.fuse.search(this.filterText).map(res => res.ans_ind);
      // // Return filtered answers in sort order as provided by Fuse
      // const filtAnswers = [];
      // filtFuseResultInds.forEach((ind) => {
      //   filtAnswers.push(this.answersWithInds.filter(ans => ans.ans_ind === ind)[0]);
      // });
      const filtAnswers = this.answersWithInds.filter(ans => filtFuseResultInds.includes(ans.ans_ind));
      return filtAnswers;
    }

    @action.bound changeFilterText(newText) {
      this.filterText = newText;
      this.updateSelectedSubGraphIndex(0);
    }

    @action.bound registerUpdateSelectedSubGraphIndexCallback(func) {
      this.updateSelectedSubGraphIndexCallback = func;
    }
    @action.bound updateSelectedSubGraphIndex(ind) {
      this.selectedSubGraphIndex = ind;
      this.updateSelectedSubGraphIndexCallback(ind);
    }
    // Called when answerId from props changes... force reset of params
    @action.bound updateSelectedSubGraphIndexById(id) {
      let idIndex = this.filteredAnswers.findIndex(a => a.id === id);
      // Reset filter if supplied answerId not found in current filteredList
      // If Interactive selector results in an answerId being supplied, this
      // will ensure that the filter is reset if the answerId is not present
      // in the current filtered list
      if (idIndex === -1) {
        this.filterText = '';
        idIndex = this.filteredAnswers.findIndex(a => a.id === id);
      }
      if (idIndex > -1 && idIndex < this.answersWithInds.length) {
        this.updateSelectedSubGraphIndex(idIndex);
      }
    }
    // Filter is reset, and Answerlist highlights answer with supplied answerId
    @action.bound updateSelectedByAnswerId(ansId) {
      this.filterText = '';
      const filteredInd = this.filteredAnswers.findIndex(ans => (ans.id === ansId));
      this.updateSelectedSubGraphIndex(filteredInd);
    }
}

export default AnswersetStore;
