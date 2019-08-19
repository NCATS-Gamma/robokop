import React from 'react';
import PropTypes from 'prop-types';
import { toJS } from 'mobx';
import { observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { FormControl, Button } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';

import AppConfig from '../../../AppConfig';
import { config } from '../../../index';
import Loading from '../../Loading';
import entityNameDisplay from '../../util/entityNameDisplay';
import NodeProperties from './NodeProperties';


const propTypes = {
  activePanel: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    set: PropTypes.bool.isRequired,
    curie: mobxPropTypes.observableArrayOf(PropTypes.string),
    name: PropTypes.string,
  }).isRequired,
};

@observer
class NodePanel extends React.Component {
  constructor(props) {
    super(props);

    this.appConfig = new AppConfig(config);

    this.input = null; // ref to search input

    this.state = {
      term: '',
      conceptsWithSets: [],
      filteredConcepts: [],
      curies: [],
      selected: {
        curie: false,
        regular: false,
        set: false,
      },
    };

    this.addSetsToConcepts = this.addSetsToConcepts.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
  }

  componentDidMount() {
    this.input.focus();
    this.addSetsToConcepts();
  }

  addSetsToConcepts() {
    const { concepts } = this.props.activePanel.store;
    const conceptsWithSets = [];
    concepts.forEach((concept) => {
      conceptsWithSets.push({ name: concept, set: false });
      conceptsWithSets.push({ name: `Set of ${concept}s`, set: true });
    });
    this.setState({ conceptsWithSets });
  }

  handleTermChange(event) {
    const term = event.target.value;
    this.setState({ term }, () => {
      this.onSearch(term);
    });
  }

  onSearch(input) {
    const { conceptsWithSets } = this.state;
    if (input.length > 2) {
      this.appConfig.questionNewSearch(input)
        .then((res) => {
          console.log('results', res);
          const filteredConcepts = conceptsWithSets.filter(concept => concept.name.includes(input));
          this.setState({ curies: res.options, filteredConcepts });
        })
        .catch((err) => {
          console.log('err', err);
        });
    } else {
      this.setState({ filteredConcepts: [], curies: [] });
    }
  }

  onSelect(selected) {
    const { activePanel } = this.props;
    let nodeFunction = 'regular';
    if (selected.curie) {
      nodeFunction = 'curieEnabled';
      activePanel.updateCurie('', selected.label, selected.curie);
    } else if (selected.set) {
      nodeFunction = 'set';
    }
    activePanel.changeNodeFunction(nodeFunction);
    this.setState({ term: entityNameDisplay(selected.name) });
  }

  rowRenderer({
    index,
    key,
    style,
  }) {
    const { filteredConcepts, curies } = this.state;
    let value = '';
    let entry = {};
    if (index < filteredConcepts.length) {
      value = entityNameDisplay(filteredConcepts[index].name);
      entry = filteredConcepts[index];
    } else {
      const i = index - filteredConcepts.length;
      value = entityNameDisplay(curies[i].name);
      entry = curies[i];
    }
    return (
      <div
        key={key}
        style={{ ...style }}
        className="nodePanelSelector"
      >
        {value}
        <Button
          onClick={() => this.onSelect(entry)}
        >
          Select
        </Button>
      </div>
    );
  }

  render() {
    const {
      filteredConcepts, curies, term, selected,
    } = this.state;
    const { store } = this.props.activePanel;
    const ready = store.dataReady && store.conceptsReady && store.userReady && store.nodePropertiesReady;
    const { activePanel } = this.props;
    const showOptions = !activePanel.curie.length;
    const rowHeight = 50;
    const nRows = filteredConcepts.length + curies.length;
    const height = Math.min(rowHeight * nRows, 225);
    return (
      <div>
        {ready ?
          <div>
            <FormControl
              type="text"
              className="curieSelectorInput"
              placeholder="Start typing to search."
              value={term}
              inputRef={(ref) => { this.input = ref; }}
              onChange={this.handleTermChange}
            />
            {showOptions &&
              <AutoSizer disableHeight defaultWidth={100}>
                {({ width }) => (
                  <List
                    style={{
                      border: 'none',
                      marginTop: '0px',
                      outline: 'none',
                    }}
                    height={height}
                    overscanRowCount={10}
                    rowCount={nRows}
                    rowHeight={rowHeight}
                    rowRenderer={this.rowRenderer}
                    width={width}
                  />
                )}
              </AutoSizer>
            }
            {selected.curie &&
              <div>
                {store.nodePropertyList[activePanel.type] && store.nodePropertyList[activePanel.type].length > 0 ?
                  <NodeProperties activePanel={activePanel} validProperties={toJS(store.nodePropertyList)} />
                  :
                  <p style={{
                      position: 'absolute', bottom: 0, width: '100%', textAlign: 'center',
                    }}
                  >
                    No constraints available for this type.
                  </p>
                }
              </div>
            }
          </div>
          :
          <Loading />
        }
      </div>
    );
  }
}

NodePanel.propTypes = propTypes;

export default NodePanel;
