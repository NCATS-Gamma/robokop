import React from 'react';
import PropTypes from 'prop-types';
import { toJS } from 'mobx';
import { observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { FormControl, Button, Badge, InputGroup, Glyphicon } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import shortid from 'shortid';

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
    type: PropTypes.string.isRequired,
    set: PropTypes.bool.isRequired,
    curie: mobxPropTypes.observableArrayOf(PropTypes.string),
    name: PropTypes.string,
  }).isRequired,
};

const setify = type => `Set of ${type}s`;

@observer
class NodePanel extends React.Component {
  constructor(props) {
    super(props);

    this.appConfig = new AppConfig(config);

    this.input = null; // ref to search input

    this.state = {
      term: '',
      curie: '',
      conceptsWithSets: [],
      filteredConcepts: [],
      curies: [],
    };

    this.addSetsToConcepts = this.addSetsToConcepts.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.findCurieType = this.findCurieType.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
    this.reset = this.reset.bind(this);
  }

  componentDidMount() {
    const { activePanel } = this.props;
    this.input.focus();
    this.addSetsToConcepts();
    this.setState({ term: activePanel.name || (activePanel.set && setify(activePanel.type)) || activePanel.type });
  }

  addSetsToConcepts() {
    const { concepts } = this.props.activePanel.store;
    const conceptsWithSets = [];
    concepts.forEach((concept) => {
      conceptsWithSets.push({ name: concept, type: concept, set: false });
      conceptsWithSets.push({ name: setify(concept), type: concept, set: true });
    });
    this.setState({ conceptsWithSets });
  }

  handleTermChange(event) {
    const { activePanel } = this.props;
    const term = event.target.value;
    if (activePanel.curie.length) {
      activePanel.resetCurie();
    }
    if (activePanel.type) {
      activePanel.updateField('type', '');
    }
    this.setState({ term }, () => {
      this.onSearch(term);
    });
  }

  onSearch(input) {
    const { conceptsWithSets } = this.state;
    if (input.length > 2) {
      this.appConfig.questionNewSearch(input)
        .then((res) => {
          if (res.options) {
            console.log('curies', res.options);
            const filteredConcepts = conceptsWithSets.filter(concept => concept.name.includes(input.toLowerCase()));
            this.setState({ curies: res.options, filteredConcepts });
          }
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
    let curie = '';
    if (selected.curie) {
      activePanel.changeNodeFunction('curieEnabled');
      activePanel.updateField('type', this.findCurieType(selected.type));
      activePanel.updateCurie('', selected.label, selected.curie);
      ({ curie } = selected);
    } else if (selected.set) {
      activePanel.changeNodeFunction('set');
      activePanel.updateField('type', selected.type);
    } else {
      activePanel.changeNodeFunction('regular');
      activePanel.updateField('type', selected.type);
    }
    this.setState({ term: entityNameDisplay(selected.name), curie });
  }

  findCurieType(curieTypes) {
    const { concepts } = this.props.activePanel.store;
    const curieType = concepts.find(concept => curieTypes.includes(concept));
    return curieType || '';
  }

  reset() {
    const { activePanel } = this.props;
    activePanel.resetNodePanel();
    this.setState({ term: '', curie: '' });
  }

  rowRenderer({
    index,
    key,
    style,
  }) {
    const { filteredConcepts, curies } = this.state;
    const isConcept = index < filteredConcepts.length;
    let value = '';
    let entry = {};
    let degree;
    let links = '';
    let curie = '';
    let type = '';
    let colorStripes = [];
    let typeColor = '';
    if (isConcept) {
      value = filteredConcepts[index].name;
      entry = filteredConcepts[index];
      ({ type } = filteredConcepts[index]); // this is a string
      const typeColorMap = getNodeTypeColorMap();
      typeColor = typeColorMap(type);
    } else {
      const i = index - filteredConcepts.length;
      value = curies[i].name;
      entry = curies[i];
      ({ degree, type } = curies[i]); // destructuring magic, type is array
      curie = curies[i].value;
      const urls = curieUrls(curies[i].name);
      links = (
        <span>
          {urls.map(u => (
            <a target="_blank" href={u.url} alt={u.label} key={shortid.generate()} style={{ paddingRight: '3px' }}><img src={u.iconUrl} alt={u.label} height={16} width={16} /></a>
          ))}
        </span>
      );
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
          <div title={entityNameDisplay(value)}>{entityNameDisplay(value)}</div>
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
      filteredConcepts, curies, term, curie,
    } = this.state;
    const { store } = this.props.activePanel;
    const ready = store.dataReady && store.conceptsReady && store.userReady && store.nodePropertiesReady;
    const { activePanel } = this.props;
    const showOptions = !activePanel.curie.length && !activePanel.type;
    const showConstraints = activePanel.type && !activePanel.curie.length;
    const rightButtonContents = showOptions ? (<Glyphicon glyph="remove" />) : (<Glyphicon glyph="triangle-bottom" />);
    const rightButtonFunction = showOptions ? this.reset : () => {};
    const rowHeight = 50;
    const nRows = filteredConcepts.length + curies.length;
    const isEmpty = nRows === 0;
    const height = Math.min(rowHeight * nRows, 225);
    return (
      <div>
        {ready ?
          <div>
            <InputGroup>
              <FormControl
                type="text"
                className="curieSelectorInput"
                placeholder="Start typing to search."
                value={term}
                inputRef={(ref) => { this.input = ref; }}
                onChange={this.handleTermChange}
              />
              {!showOptions &&
                <InputGroup.Addon>
                  {curie}
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
                {!isEmpty ?
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
                      No results found.
                    </span>
                  </div>
                }
              </div>
            }
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
