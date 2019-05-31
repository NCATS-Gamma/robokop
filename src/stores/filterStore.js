import { observable, action, computed, configure, runInAction, isObservableArray, toJS } from 'mobx';

const _ = require('lodash');

configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

class AnswersetFilterStore {
  @observable answers = [];
  @observable nodeId = null;
  @observable filter = {};
  @observable searchedFilter = {};
  @observable selectedFilter = {};
  @observable filteredAnswers = []; // array of filtered answers
  @observable availableAnswers = {};
  @observable filterHash = ''; // hash of filtered answers object for checking if we need to get available answers
  @observable openPanels = [];

  // we don't want to include any of these in the filter
  blacklist = ['isSet', 'labels', 'equivalent_identifiers', 'type', 'id', 'degree'];

  constructor(answers, nodeId) {
    runInAction(() => {
      this.answers = answers;
      this.nodeId = nodeId;
      this.initializeFilter();
      this.checkAll();
    });
  }

  initializeFilter() {
    const filter = {};
    const openPanels = [];
    let { answers } = this;
    // check to see if the node is a set
    if (this.answers[0].nodes[this.nodeId].isSet) {
      // if node is a set, dig down to where the nodes are
      answers = this.answers.map(answer => answer.nodes[this.nodeId].setNodes.map(answerSet => answerSet));
    }
    // get only keys that are in every answer
    let filterArray = this.getKeyIntersection(answers);
    // remove all unwanted keys
    filterArray = filterArray.filter(key => !this.blacklist.includes(key));
    // iterate over valid keys and construct filter object
    filterArray.forEach((key) => {
      openPanels.push(false);
      filter[key] = [];
      // if the answer is a set
      if (isObservableArray(answers[0])) {
        answers.forEach((set) => {
          set.forEach((ans) => {
            if (!filter[key].includes(ans[key].toString())) {
              filter[key].push(ans[key]);
            }
          });
        });
      // if the answer isn't a set
      } else {
        answers.forEach((ans) => {
          if (!filter[key].includes(ans.nodes[this.nodeId][key].toString())) {
            filter[key].push(ans.nodes[this.nodeId][key].toString());
          }
        });
      }
    });
    this.filter = filter;
    this.searchedFilter = filter;
    this.filterArray = filterArray;
    this.openPanels = openPanels;
  }

  // get only keys that show up in every single answer
  getKeyIntersection(answers) {
    const keys = [];
    answers.forEach((ans) => {
      // check if set or not
      if (isObservableArray(ans)) {
        ans.forEach((setAns) => {
          const answerKeys = Object.keys(setAns);
          answerKeys.forEach((key, index) => {
            // for consistency, change all spaces to underscores
            answerKeys[index] = key.replace(/ /g, '_');
          });
          keys.push(answerKeys);
        });
      } else {
        const answerKeys = Object.keys(ans.nodes[this.nodeId]);
        answerKeys.forEach((key, index) => {
          // for consistency, change all spaces to underscores
          answerKeys[index] = key.replace(/ /g, '_');
        });
        keys.push(answerKeys);
      }
    });
    // lodash intersection has some limitation. We need to batch the keys if they get too big.
    const intersect = [];
    while (keys.length > 500) {
      intersect.push(_.intersection(...keys.splice(0, 500)));
    }
    // if we needed to batch, find the intersection with the remainder of the keys.
    if (intersect.length) {
      intersect.push(...keys);
      return _.intersection(...intersect);
    }
    // We didn't need to batch, just find the intersection of the keys.
    return _.intersection(...keys);
  }

  // given the updated table data, find which keys are still valid
  @action getAvailableAnswers(filteredAnswers) {
    const avail = {};
    this.filterArray.forEach((key) => {
      avail[key] = [];
      filteredAnswers.forEach((ans) => {
        // the data back from the table is nested in an _original
        const originalAnswers = ans._original;
        if (originalAnswers && originalAnswers.nodes[this.nodeId].isSet) {
          originalAnswers.nodes[this.nodeId].setNodes.forEach((setAns) => {
            if (!avail[key].includes(String(setAns[key]))) {
              avail[key].push(String(setAns[key]));
            }
          });
        } else if (!avail[key].includes(String((originalAnswers && String(originalAnswers.nodes[this.nodeId][key])) || ans.nodes[this.nodeId][key]))) {
          avail[key].push(String((originalAnswers && String(originalAnswers.nodes[this.nodeId][key])) || ans.nodes[this.nodeId][key]));
        }
      });
    });
    this.availableAnswers = avail;
  }

  // handle the search bar in the filter panel
  @action searchFilter(value) {
    const searchedFilter = {};
    Object.keys(this.filter).forEach((key) => {
      searchedFilter[key] = [];
      this.filter[key].forEach((val) => {
        if (val.toLowerCase().includes(value.toLowerCase())) {
          searchedFilter[key].push(val);
        }
      });
    });
    this.searchedFilter = searchedFilter;
  }

  // check or uncheck all options
  @action checkAll(keysArray, allAnswers, checked) {
    // this function can be called with different arguments depending on what needs to happen
    // if no arguments given, take all the options and check them
    // if checked is true, uncheck everything, otherwise uncheck everything
    const keys = keysArray && keysArray.length ? keysArray : this.filterArray;
    const answers = allAnswers || this.answers;
    const { selectedFilter } = this;
    keys.forEach((key) => {
      selectedFilter[key] = new Set(selectedFilter[key]);
      answers.forEach((ans) => {
        if (ans.nodes && ans.nodes[this.nodeId].isSet) {
          ans.nodes[this.nodeId].setNodes.forEach((setAns) => {
            if (checked) {
              selectedFilter[key].delete(String((setAns[key])));
            } else {
              selectedFilter[key].add(String((setAns[key])));
            }
          });
        // else it's not a set, we check if it's checked or not and do the opposite.
        } else if (checked) {
          selectedFilter[key].delete(String((ans.nodes && String(ans.nodes[this.nodeId][key])) || ans));
        } else {
          selectedFilter[key].add(String((ans.nodes && String(ans.nodes[this.nodeId][key])) || ans));
        }
      });
    });
    // we're just converting all the Sets back to normal arrays here
    Object.keys(selectedFilter).forEach((key) => {
      selectedFilter[key] = [...selectedFilter[key]];
    });
    this.selectedFilter = selectedFilter;
    return selectedFilter;
  }

  // given a value and an id, either check it or uncheck it
  @action check(value, id) {
    // the id comes in from the input weird, we just need its key
    const key = id.split('-')[0];
    const filterValues = this.selectedFilter;
    filterValues[key] = new Set(filterValues[key]);
    if (filterValues[key].has(value)) {
      filterValues[key].delete(value);
    } else {
      filterValues[key].add(value);
    }
    // convert the Set back into an array
    filterValues[key] = [...filterValues[key]];
    this.selectedFilter = filterValues;
    return this.selectedFilter;
  }

  // checks if the master toggle check should be checked by checking the length of the selected filter against the entire filter
  @action shouldBeChecked(key) {
    return this.selectedFilter[key] && this.selectedFilter[key].length === this.filter[key].length;
  }
}

export default AnswersetFilterStore;
