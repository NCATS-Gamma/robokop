import React from 'react';
import { observer } from 'mobx-react';
import FaFilter from 'react-icons/lib/fa/filter';
import FaCheck from 'react-icons/lib/fa/check';
import { OverlayTrigger, Popover, Button, Panel } from 'react-bootstrap';
import FaPlus from 'react-icons/lib/fa/plus';
import FaMinus from 'react-icons/lib/fa/minus';

import entityNameDisplay from '../util/entityNameDisplay';

const shortid = require('shortid');

@observer
class AnswersetFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      openPanels: [],
    };

    // this.filterStore = new AnswersetFilterStore(props.answers, props.nodeId);

    this.filterHash = '';
    this.check = this.check.bind(this);
    this.reset = this.reset.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.togglePanel = this.togglePanel.bind(this);
  }

  componentDidMount() {
    this.props.store.initializeFilter(this.props.nodeId);
    this.setState({ search: '' });
    // console.log('filter', this.props.store.filter);
  }

  componentDidUpdate() {
    // if (this.filterHash !== this.store.filterHash) {
    //   // this.filterStore.getAvailableAnswers(messageStore.filteredAnswers);
    // }
  }

  handleSearch(event) {
    const { value } = event.target;
    // this.filterStore.searchFilter(value);
    this.setState({ search: value });
  }

  check(event) {
    const { value, id } = event.target;
    console.log('event', event.target);
    const { nodeId, store } = this.props;
    store.updateFilter(value, nodeId, id);
    this.props.onChange({});
  }

  reset() {
    const { nodeId, store } = this.props;
    store.reset(nodeId);
  }

  togglePanel(index) {
    this.setState((state) => {
      const { openPanels } = state;
      openPanels[index] = !state.openPanels[index];
      return { openPanels };
    });
  }

  render() {
    const { nodeId, store } = this.props;
    const { filter } = store;
    const isFiltered = this.props.store.isFiltered(nodeId);
    const { search, openPanels } = this.state;
    const filterPopover = (
      <Popover id={shortid.generate()} className="answersetFilter" >
        <input
          value={search}
          onChange={this.handleSearch}
          placeholder="Search"
          style={{ width: '100%', padding: '5px' }}
        />
        <Button style={{ display: 'block', margin: '10px auto' }} onClick={this.reset}>Reset</Button>
        {Object.keys(filter[nodeId] || {}).map((key, index) => {
          const style = { fontWeight: 'normal', whiteSpace: 'nowrap', overflow: 'auto' };
          if (filter[nodeId][key].type !== 'bool') {
            return (
              <div key={shortid.generate()}>
                <Panel expanded={openPanels[index]} onToggle={() => {}}>
                  <Panel.Heading>
                    <Panel.Title>
                      <button onClick={() => this.togglePanel(index)}>{this.state.openPanels[index] ? <FaMinus /> : <FaPlus />}</button>
                      <span>{entityNameDisplay(key)}</span>
                    </Panel.Title>
                  </Panel.Heading>
                  <Panel.Body collapsible>
                    {Object.keys(filter[nodeId][key].value).map((option, i) => (
                      <div key={shortid.generate()} style={{ paddingLeft: '20px', display: 'flex' }}>
                        <label
                          htmlFor={`${key}-${i}`}
                          style={style}
                        >
                          <input
                            type="checkbox"
                            id={`${key}-${i}`}
                            value={option}
                            defaultChecked={filter[nodeId][key].value[option]}
                            onChange={this.check}
                            style={{ marginRight: '10px' }}
                          />
                          {option}
                        </label>
                      </div>
                    ))}
                  </Panel.Body>
                </Panel>
              </div>
            );
          }
          // if the property is just a boolean
          return (
            <div key={shortid.generate()}>
              <Panel expanded onToggle={() => {}}>
                <Panel.Heading>
                  <Panel.Title>
                    <span>{entityNameDisplay(key)}</span>
                  </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                  <div key={shortid.generate()} style={{ paddingLeft: '20px', display: 'flex' }}>
                    <label
                      htmlFor={key}
                      style={style}
                    >
                      <input
                        type="checkbox"
                        id={key}
                        value={filter[nodeId][key].value}
                        defaultChecked={filter[nodeId][key].value}
                        onChange={this.check}
                        style={{ marginRight: '10px' }}
                      />
                      {key}
                    </label>
                  </div>
                </Panel.Body>
              </Panel>
            </div>
          );
        })}
      </Popover>
    );
    return (
      <div>
        <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={filterPopover}>
          <Button style={{ width: '100%', textAlign: 'center', cursor: 'pointer' }}><FaFilter /> {isFiltered && <FaCheck />}</Button>
        </OverlayTrigger>
      </div>
    );
  }
}

export default AnswersetFilter;
