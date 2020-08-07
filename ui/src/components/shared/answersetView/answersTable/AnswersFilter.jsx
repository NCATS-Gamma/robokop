import React from 'react';
import {
  FaFilter, FaCheck, FaPlus, FaMinus,
} from 'react-icons/fa';
import {
  OverlayTrigger, Popover, Button, Panel,
} from 'react-bootstrap';
import shortid from 'shortid';

import entityNameDisplay from '../../../../utils/entityNameDisplay';

class AnswersFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      openPanels: [],
    };

    this.filterHash = '';
    this.check = this.check.bind(this);
    this.checkAll = this.checkAll.bind(this);
    this.reset = this.reset.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.togglePanel = this.togglePanel.bind(this);
  }

  handleSearch(event) {
    const { value } = event.target;
    const { qnodeId, store } = this.props;
    store.searchFilter(qnodeId, value);
    this.setState({ search: value });
  }

  check(propertyKey, propertyValue) {
    const { qnodeId, store, onChange } = this.props;
    store.updateFilterKeys(qnodeId, propertyKey, propertyValue);
    onChange({});
  }

  checkAll(propertyKey) {
    const { qnodeId, store, onChange } = this.props;
    store.checkAll(qnodeId, propertyKey);
    onChange({});
  }

  reset() {
    const { qnodeId, store, onChange } = this.props;
    store.reset(qnodeId);
    onChange({});
    this.setState({ search: '' });
  }

  togglePanel(index) {
    this.setState((state) => {
      const { openPanels } = state;
      openPanels[index] = !state.openPanels[index];
      return { openPanels };
    });
  }

  render() {
    const { qnodeId, store } = this.props;
    const { searchedFilter, filterKeys } = store;
    const isFiltered = store.isFiltered(qnodeId);
    const { search, openPanels } = this.state;
    const filterPopover = (
      <Popover id={shortid.generate()} className="answersetFilter">
        <input
          value={search}
          onChange={this.handleSearch}
          placeholder="Search"
          style={{ width: '100%', padding: '5px' }}
        />
        <Button style={{ display: 'block', margin: '10px auto' }} onClick={this.reset}>Reset</Button>
        {Object.keys(searchedFilter[qnodeId] || {}).map((propertyKey, index) => {
          // if there aren't any values under the header, don't show anything
          if (Object.keys(searchedFilter[qnodeId][propertyKey]).length) {
            return (
              <div key={shortid.generate()}>
                <Panel expanded={openPanels[index]} onToggle={() => {}}>
                  <Panel.Heading>
                    <Panel.Title>
                      <button
                        onClick={() => this.togglePanel(index)}
                        type="button"
                      >
                        {openPanels[index] ? <FaMinus /> : <FaPlus />}
                      </button>
                      <span style={{ marginLeft: 10, fontWeight: 'bold' }}>{entityNameDisplay(propertyKey)}</span>
                      <label htmlFor={`${propertyKey}-select`} className="pull-right">
                        <input
                          type="checkbox"
                          id={`${propertyKey}-select`}
                          defaultChecked={!store.isPropFiltered(filterKeys[qnodeId][propertyKey])}
                          onChange={() => this.checkAll(propertyKey)}
                          style={{ marginRight: '10px' }}
                        />
                        Toggle All
                      </label>
                    </Panel.Title>
                  </Panel.Heading>
                  <Panel.Body collapsible>
                    {Object.keys(searchedFilter[qnodeId][propertyKey]).map((propertyValue, i) => {
                      const style = { fontWeight: 'normal', whiteSpace: 'nowrap', overflow: 'auto' };
                      if (!filterKeys[qnodeId][propertyKey][propertyValue][1]) {
                        style.color = 'lightgrey';
                      }
                      return (
                        <div key={shortid.generate()} style={{ paddingLeft: '20px', display: 'flex' }}>
                          <label
                            htmlFor={`${propertyKey}-${i}`}
                            style={style}
                          >
                            <input
                              type="checkbox"
                              id={`${propertyKey}-${i}`}
                              defaultChecked={filterKeys[qnodeId][propertyKey][propertyValue][0]}
                              onChange={() => this.check(propertyKey, propertyValue)}
                              style={{ marginRight: '10px' }}
                            />
                            {propertyValue}
                          </label>
                        </div>
                      );
                    })}
                  </Panel.Body>
                </Panel>
              </div>
            );
          }
          return null;
        })}
      </Popover>
    );
    return (
      <div>
        <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={filterPopover}>
          <Button
            style={{
              display: 'flex', justifyContent: 'center', width: '100%', cursor: 'pointer',
            }}
          >
            <FaFilter /> {isFiltered && <FaCheck />}
          </Button>
        </OverlayTrigger>
      </div>
    );
  }
}

export default AnswersFilter;
