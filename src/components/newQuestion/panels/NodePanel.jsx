import React from 'react';
import PropTypes from 'prop-types';
import { toJS } from 'mobx';
import { observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { FormControl, Button, Badge, InputGroup, Glyphicon } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import shortid from 'shortid';
import _ from 'lodash';

import AppConfig from '../../../AppConfig';
import { config } from '../../../index';
import Loading from '../../Loading';
import entityNameDisplay from '../../util/entityNameDisplay';
import curieUrls from '../../util/curieUrls';
import getNodeTypeColorMap from '../../util/colorUtils';
import NodeProperties from './NodeProperties';


const propTypes = {
  activePanel: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string,
    set: PropTypes.bool.isRequired,
    curie: mobxPropTypes.observableArrayOf(PropTypes.string),
    name: PropTypes.string,
  }).isRequired,
};

const setify = type => `set of ${type}s`;

@observer
class NodePanel extends React.Component {
  constructor(props) {
    super(props);

    this.appConfig = new AppConfig(config);

    this.input = null; // ref to search input

    this.state = {
      conceptsWithSets: [],
      filteredConcepts: [],
      curies: [],
      loading: false,
    };

    this.addSetsToConcepts = this.addSetsToConcepts.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.deboundedSearch = _.debounce(this.onSearch, 250);
    this.reSearch = this.reSearch.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.findCurieType = this.findCurieType.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
    this.reset = this.reset.bind(this);
  }

  componentDidMount() {
    this.input.focus();
    this.addSetsToConcepts();
  }

  addSetsToConcepts() {
    const { concepts } = this.props.activePanel.store;
    const conceptsWithSets = [];
    concepts.forEach((concept) => {
      conceptsWithSets.push({ label: concept, type: concept, set: false });
      conceptsWithSets.push({ label: setify(concept), type: concept, set: true });
    });
    this.setState({ conceptsWithSets });
  }

  handleTermChange(event) {
    const { activePanel } = this.props;
    const term = event.target.value;
    activePanel.updateSearchTerm(term);
    this.setState({ loading: true }, () => {
      this.deboundedSearch(term);
    });
  }

  onSearch(input) {
    const { conceptsWithSets } = this.state;
    if (input.length > 2) {
      this.appConfig.questionNewSearch(input)
        .then((res) => {
          if (res.cancelled) {
            return;
          }
          let curies = [];
          const filteredConcepts = conceptsWithSets.filter(concept => concept.label.includes(input.toLowerCase()));
          if (res.options) {
            curies = res.options;
          }
          this.setState({ curies, filteredConcepts, loading: false });
        })
        .catch((err) => {
          console.log('err', err); // eslint-disable-line
        });
    } else {
      this.setState({ filteredConcepts: [], curies: [] });
    }
  }

  onSelect(selected) {
    const { activePanel } = this.props;
    activePanel.updateSearchTerm(entityNameDisplay(selected.label));
    if (selected.curie) {
      activePanel.changeNodeFunction('curieEnabled');
      activePanel.updateField('type', this.findCurieType(selected.type));
      activePanel.updateCurie('', selected.label, selected.curie);
    } else if (selected.set) {
      activePanel.changeNodeFunction('set');
      activePanel.updateField('type', selected.type);
    } else if (!selected.type) {
      activePanel.updateField('type', 'named_thing');
      activePanel.changeNodeFunction('curieEnabled');
      activePanel.updateCurie('', selected.label, selected.value);
    } else {
      activePanel.changeNodeFunction('regular');
      activePanel.updateField('type', selected.type);
    }
  }

  findCurieType(curieTypes) {
    let { concepts } = this.props.activePanel.store;
    concepts = concepts.filter(t => t !== 'named_thing');
    const curieType = concepts.find(concept => curieTypes.includes(concept));
    return curieType || '';
  }

  reset() {
    const { activePanel } = this.props;
    activePanel.resetNodePanel();
    activePanel.updateSearchTerm('');
    this.input.focus();
    this.setState({ filteredConcepts: [], curies: [] });
  }

  reSearch() {
    const { activePanel } = this.props;
    const { searchTerm } = activePanel;
    activePanel.resetNodePanel();
    this.setState({ filteredConcepts: [], curies: [] }, () => {
      this.onSearch(searchTerm);
    });
  }

  rowRenderer({
    index,
    key,
    style,
  }) {
    const { filteredConcepts, curies } = this.state;
    const isConcept = index < filteredConcepts.length;
    let name = '';
    let entry = {};
    let degree;
    let links = '';
    let curie = '';
    let type = '';
    let colorStripes = [];
    let typeColor = '';
    if (isConcept) {
      name = filteredConcepts[index].label;
      entry = filteredConcepts[index];
      ({ type } = filteredConcepts[index]); // this is a string
      const typeColorMap = getNodeTypeColorMap();
      typeColor = typeColorMap(type);
    } else {
      const i = index - filteredConcepts.length;
      name = curies[i].label;
      entry = curies[i];
      ({ degree, type } = curies[i]); // destructuring magic, type is array
      curie = curies[i].value;
      const urls = curieUrls(curie);
      links = (
        <span>
          {urls.map(u => (
            <a target="_blank" href={u.url} alt={u.label} key={shortid.generate()} style={{ paddingRight: '3px' }}><img src={u.iconUrl} alt={u.label} height={16} width={16} /></a>
          ))}
        </span>
      );
      if (Array.isArray(type)) {
        type = type.filter(t => t !== 'named_thing');
        const typeColorMap = getNodeTypeColorMap(type);
        colorStripes = type.map(t => (
          <div
            title={t}
            style={{
              backgroundColor: typeColorMap(t),
              height: '100%',
              width: '5px',
            }}
            key={shortid.generate()}
          />
        ));
      }
    }

    const fullColor = typeof type === 'string';

    return (
      <div
        key={key}
        style={{ ...style, backgroundColor: typeColor }}
        className="nodePanelSelector"
        id={index === filteredConcepts.length - 1 && curies.length > 0 ? 'lastConcept' : ''}
      >
        {!fullColor &&
          <div className="colorStripesContainer">
            {colorStripes}
          </div>
        }
        <div className="curieName">
          <div title={entityNameDisplay(name)}>{entityNameDisplay(name)}</div>
        </div>
        <div className="curieDetails">
          {curie}
          <Badge>{degree}</Badge>
          {links}
          <Button
            onClick={() => this.onSelect(entry)}
          >
            Select
          </Button>
        </div>
      </div>
    );
  }

  render() {
    const {
      filteredConcepts, curies, loading,
    } = this.state;
    const { store } = this.props.activePanel;
    const ready = store.dataReady && store.conceptsReady && store.userReady && store.nodePropertiesReady;
    const { activePanel } = this.props;
    const showOptions = activePanel.searchTerm && !activePanel.type;
    const showConstraints = activePanel.regular || activePanel.set;
    const rightButtonContents = showOptions ? (<Glyphicon glyph="remove" />) : (<Glyphicon glyph="triangle-bottom" />);
    const rightButtonFunction = showOptions ? this.reset : this.reSearch;
    const rowHeight = 50;
    const nRows = filteredConcepts.length + curies.length;
    const isEmpty = nRows === 0;
    const height = Math.min(rowHeight * nRows, 225);
    return (
      <div>
        {ready ?
          <div>
            <h4 style={{ color: '#CCCCCC' }}>NODE TYPE</h4>
            <div id="nodeSelectorContainer">
              <InputGroup>
                <FormControl
                  type="text"
                  className="curieSelectorInput"
                  placeholder="Start typing to search."
                  value={activePanel.searchTerm}
                  inputRef={(ref) => { this.input = ref; }}
                  onChange={this.handleTermChange}
                />
                {!showOptions && activePanel.curie.length > 0 &&
                  <InputGroup.Addon>
                    {activePanel.curie[0]}
                  </InputGroup.Addon>
                }
                <InputGroup.Addon
                  onClick={rightButtonFunction}
                  style={{ background: '#fff', cursor: 'pointer' }}
                >
                  {rightButtonContents}
                </InputGroup.Addon>
              </InputGroup>
              {showOptions &&
                <div style={{ margin: '0px 10px' }}>
                  {!isEmpty && !loading ?
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
                    :
                    <div
                      className="nodePanelSelector"
                      style={{ padding: '10px', color: '#ccc' }}
                    >
                      <span>
                        {loading ? 'Loading...' : 'No results found.'}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>
            {showConstraints &&
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
