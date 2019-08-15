import React from 'react';
import PropTypes from 'prop-types';
import { Form, ToggleButtonGroup, ToggleButton, Checkbox } from 'react-bootstrap';
import { toJS } from 'mobx';
import { observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { DropdownList } from 'react-widgets';

import Loading from '../../Loading';
import CurieSelectorContainer from '../../shared/curies/CurieSelectorContainer';
import entityNameDisplay from '../../util/entityNameDisplay';
import NodeProperties from './NodeProperties';

const nodeFuntionList = ['regular', 'set', 'curieEnabled'];

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

    this.onSearch = this.onSearch.bind(this);
    this.handleSetCheckbox = this.handleSetCheckbox.bind(this);
    this.handleRegularButton = this.handleRegularButton.bind(this);
  }

  onSearch(input, nodeType) {
    return this.props.activePanel.store.appConfig.questionNewSearch(input, nodeType);
  }

  handleSetCheckbox(event) {
    const { activePanel } = this.props;
    const { checked } = event.target;
    if (checked) {
      activePanel.changeNodeFunction('set');
    } else {
      activePanel.changeNodeFunction('regular');
    }
  }

  handleRegularButton() {
    const { activePanel } = this.props;
    const nodeFunction = nodeFuntionList.find(func => activePanel[func]);
    if (!nodeFunction || nodeFunction === 'curieEnabled') {
      activePanel.changeNodeFunction('regular');
    }
  }

  render() {
    const { store } = this.props.activePanel;
    const ready = store.dataReady && store.conceptsReady && store.userReady && store.nodePropertiesReady;
    const { activePanel } = this.props;
    const { isValidType } = activePanel;
    const nodeFunction = nodeFuntionList.find(func => activePanel[func]);
    console.log(nodeFunction);
    const dropDownObjList = activePanel.store.concepts.map(c => ({ text: entityNameDisplay(c), value: c }));
    const disableCurie = activePanel.type === 'named_thing' ? 'curieEnabled' : '';
    let curie;
    if (toJS(activePanel.curie).length !== 0) {
      curie = { curie: activePanel.curie[0], type: activePanel.type, term: activePanel.name };
    } else {
      curie = { type: activePanel.type, curie: '', term: '' };
    }
    return (
      <div>
        {ready ?
          <div>
            <Form horizontal>
              <ToggleButtonGroup
                type="radio"
                name="nodeToggle"
                justified
                defaultValue={nodeFunction === 'set' ? 'regular' : nodeFunction}
                onChange={() => {}} // react-bootstrap sucks
                id="nodeFunctionButtonGroup"
              >
                <ToggleButton value="curieEnabled" onClick={() => activePanel.changeNodeFunction('curieEnabled')}>Specific Node</ToggleButton>
                <ToggleButton value="regular" onClick={this.handleRegularButton}>General Node</ToggleButton>
              </ToggleButtonGroup>
              {nodeFunction &&
                <DropdownList
                  filter
                  placeholder="Select a Biomedical Type"
                  data={dropDownObjList}
                  textField="text"
                  valueField="value"
                  value={activePanel.type}
                  onChange={value => activePanel.updateField('type', value.value)}
                  disabled={nodeFunction === 'curieEnabled' ? ['named_thing'] : []}
                />
              }
            </Form>
            {isValidType && nodeFunction === 'curieEnabled' && !disableCurie &&
              <div style={{ display: 'table', width: '100%' }}>
                <div
                  style={{ display: 'table-row' }}
                >
                  <div
                    style={{ display: 'table-cell', padding: '5px 0px' }}
                  >
                    <CurieSelectorContainer
                      concepts={toJS(activePanel.store.concepts)}
                      search={this.onSearch}
                      disableType
                      initialInputs={curie}
                      onChangeHook={(ty, te, cu) => activePanel.updateCurie(ty, te, cu)}
                    />
                  </div>
                </div>
              </div>
            }
            {isValidType && nodeFunction && nodeFunction !== 'curieEnabled' &&
              <Checkbox checked={activePanel.set} onChange={event => this.handleSetCheckbox(event)}>Allow this node to be a set</Checkbox>
            }
            {isValidType && nodeFunction !== 'curieEnabled' &&
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
