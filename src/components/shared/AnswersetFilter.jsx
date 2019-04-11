import React from 'react';
import { observer } from 'mobx-react';
import FaFilter from 'react-icons/lib/fa/filter';
import FaCheck from 'react-icons/lib/fa/check';
import { OverlayTrigger, Popover } from 'react-bootstrap';

const shortid = require('shortid');
const _ = require('lodash');

@observer
class AnswersetFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      filter: {},
      searchedFilter: {},
      avail: {},
      selectedFilter: {},
      filterArray: [],
    };

    this.blacklist = ['isSet', 'labels', 'equivalent_identifiers', 'type', 'id'];
    this.filtHash = '';
    this.filter = this.filter.bind(this);
    this.getKeyIntersection = this.getKeyIntersection.bind(this);
    this.check = this.check.bind(this);
    this.checkAll = this.checkAll.bind(this);
    this.getAvailableAnswers = this.getAvailableAnswers.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  componentWillMount() {
    const { columnId, answers } = this.props;
    this.filter(columnId, answers);
  }

  componentDidUpdate() {
    const { columnId, store } = this.props;
    if (this.filtHash !== store.filterHash) {
      this.getAvailableAnswers(columnId, store.filteredAnswers);
    }
  }

  getAvailableAnswers(columnId, filteredAns) {
    const { filterArray } = this.state;
    const { store, answers } = this.props;
    this.filtHash = store.filterHash;
    const filteredAnswers = filteredAns || answers;
    const avail = {};
    filterArray.forEach((key) => {
      avail[key] = [];
      filteredAnswers.forEach((ans) => {
        if (ans._original && ans._original.nodes[columnId].isSet) {
          ans._original.nodes[columnId].setNodes.forEach((setAns) => {
            if (!avail[key].includes(String(setAns[key]))) {
              avail[key].push(String(setAns[key]));
            }
          });
        } else if (!avail[key].includes(String((ans._original && String(ans._original.nodes[columnId][key])) || ans.nodes[columnId][key]))) {
          avail[key].push(String((ans._original && String(ans._original.nodes[columnId][key])) || ans.nodes[columnId][key]));
        }
      });
    });
    this.setState({ avail });
  }

  filter(columnId, currentAnswers) {
    const filter = {};
    let answers = currentAnswers;
    if (currentAnswers[0].nodes[columnId].isSet) {
      answers = currentAnswers.map(ans => ans.nodes[columnId].setNodes.map(anss => anss));
    }
    // get only keys that are in every answer
    let filterArray = this.getKeyIntersection(answers, columnId);
    // remove all unwanted keys
    filterArray = filterArray.filter(key => !this.blacklist.includes(key));
    filterArray.forEach((key) => {
      filter[key] = [];
      if (Array.isArray(answers[0])) {
        answers.forEach((set) => {
          set.forEach((ans) => {
            if (!filter[key].includes(ans[key].toString())) {
              filter[key].push(ans[key]);
            }
          });
        });
      } else {
        answers.forEach((ans) => {
          if (!filter[key].includes(ans.nodes[columnId][key].toString())) {
            filter[key].push(ans.nodes[columnId][key].toString());
          }
        });
      }
    });
    this.setState({
      filter, searchedFilter: filter, filterArray,
    }, () => {
      this.checkAll();
    });
  }

  getKeyIntersection(answers, columnId) {
    const keys = [];
    answers.forEach((ans) => {
      if (Array.isArray(ans)) {
        ans.forEach((setAns) => {
          const answerKeys = Object.keys(setAns);
          answerKeys.forEach((key, index) => {
            // for consistency, change all spaces to underscores
            answerKeys[index] = key.replace(/ /g, '_');
          });
          keys.push(answerKeys);
        });
      } else {
        const answerKeys = Object.keys(ans.nodes[columnId]);
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

  checkAll(keysArray, allAnswers, checked) {
    const keys = (keysArray && keysArray.length && keysArray) || this.state.filterArray;
    const answers = allAnswers || this.props.answers;
    const { selectedFilter } = this.state;
    const { columnId } = this.props;
    keys.forEach((key) => {
      selectedFilter[key] = new Set(selectedFilter[key]);
      answers.forEach((ans) => {
        if (ans.nodes && ans.nodes[columnId].isSet) {
          ans.nodes[columnId].setNodes.forEach((setAns) => {
            if (checked) {
              selectedFilter[key].delete(String((setAns[key])));
            } else {
              selectedFilter[key].add(String((setAns[key])));
            }
          });
        } else {
          if (checked) {
            selectedFilter[key].delete(String((ans.nodes && String(ans.nodes[columnId][key])) || ans));
          } else {
            selectedFilter[key].add(String((ans.nodes && String(ans.nodes[columnId][key])) || ans));
          }
        }
      });
    });
    Object.keys(selectedFilter).forEach((key) => {
      selectedFilter[key] = [...selectedFilter[key]];
    });
    this.props.onChange({ selectedFilter });
    this.setState({ selectedFilter });
  }

  shouldBeChecked(key) {
    const { selectedFilter, filter } = this.state;
    return selectedFilter[key] && selectedFilter[key].length === filter[key].length;
  }

  check(event) {
    const { value, id } = event.target;
    const key = id.split('-')[0];
    const filterValues = this.state.selectedFilter;
    filterValues[key] = new Set(filterValues[key]);
    if (filterValues[key].has(value)) {
      filterValues[key].delete(value);
    } else {
      filterValues[key].add(value);
    }
    filterValues[key] = [...filterValues[key]];
    this.props.onChange({ selectedFilter: filterValues });
    this.setState({ selectedFilter: filterValues });
  }

  handleSearch(event) {
    const { value } = event.target;
    const { filter } = this.state;
    const searchedFilter = {};
    Object.keys(filter).forEach((key) => {
      searchedFilter[key] = [];
      filter[key].forEach((val) => {
        if (val.toLowerCase().includes(value.toLowerCase())) {
          searchedFilter[key].push(val);
        }
      });
    });
    this.setState({ search: value, searchedFilter });
  }

  render() {
    const {
      searchedFilter, avail, search, selectedFilter, filter,
    } = this.state;
    let filterApplied = false;
    Object.keys(filter).forEach((key) => {
      if (filter[key] && selectedFilter[key]) {
        if (!(filter[key].length === selectedFilter[key].length)) {
          filterApplied = true;
        }
      }
    });
    const filterPopover = (
      <Popover id={shortid.generate()} className="answersetFilter" >
        <input
          value={search}
          onChange={this.handleSearch}
          placeholder="Search"
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button style={{ display: 'block', margin: 'auto' }} onClick={this.checkAll}>Reset All</button>
        {Object.keys(searchedFilter).map((key) => {
          if (searchedFilter[key].length) {
            return (
              <div key={shortid.generate()}>
                <h3 style={{ display: 'inline-block', marginTop: '0px', marginRight: '25px' }}>{key}</h3>
                <div className="pull-right">
                  <input
                    type="checkbox"
                    id={`${key}-select`}
                    defaultChecked={this.shouldBeChecked(key)}
                    onChange={() => this.checkAll([key], searchedFilter[key], this.shouldBeChecked(key))}
                  />
                  <label htmlFor={`${key}-select`}>Toggle All</label>
                </div>
                <hr />
                {searchedFilter[key].map((option, i) => {
                  const style = { fontWeight: 'normal', whiteSpace: 'nowrap' };
                  if (avail[key] && avail[key].length && !avail[key].includes(option)) {
                    style.color = 'lightgrey';
                  }
                  return (
                    <div key={shortid.generate()} style={{ paddingLeft: '20px', display: 'flex' }}>
                      <input
                        type="checkbox"
                        id={`${key}-${i}`}
                        value={option}
                        defaultChecked={selectedFilter[key] && selectedFilter[key].indexOf(option) > -1}
                        onChange={this.check}
                        style={{ marginRight: '10px' }}
                      />
                      <label
                        htmlFor={`${key}-${i}`}
                        style={style}
                      >
                        {option}
                      </label>
                    </div>);
                })}
              </div>);
          }
          return null;
        })}
      </Popover>
    );
    return (
      <div>
        <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={filterPopover}>
          <div style={{ width: '100%', textAlign: 'center', cursor: 'pointer' }}><FaFilter /> {filterApplied && <FaCheck />}</div>
        </OverlayTrigger>
      </div>
    );
  }
}

export default AnswersetFilter;
