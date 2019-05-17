import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import { toJS } from 'mobx';
import { observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { DropdownList } from 'react-widgets';

import Loading from './../Loading';
import LabeledFormGroup from './../shared/LabeledFormGroup';
import CurieSelectorContainer from './../shared/curies/CurieSelectorContainer';
import entityNameDisplay from '../util/entityNameDisplay';
import NodeProperties from './NodeProperties';

const classNames = {
  formLabel: 'col-md-2 form-label',
  formControl: 'col-md-10',
};

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
    this.validateFormElement = this.validateFormElement.bind(this);
  }

  /**
   * Return if the specific form element is valid.
   */
  validateFormElement(field) {
    let isValid = false;
    const { activePanel } = this.props;
    switch (field.toLowerCase()) {
      case 'type':
        isValid = activePanel.isValidInput;
        break;
      case 'curie':
        isValid = this.props.activePanel.isValidCurieList;
        break;
      default:
        break;
    }
    return isValid ? 'success' : 'error';
  }

  onSearch(input, nodeType) {
    return this.props.activePanel.store.appConfig.questionNewSearch(input, nodeType);
  }

  render() {
    const { store } = this.props.activePanel;
    const ready = store.dataReady && store.conceptsReady && store.userReady && store.nodePropertiesReady;
    const { activePanel } = this.props;
    const { isValidType, curieEnabled } = activePanel;
    const dropDownObjList = activePanel.store.concepts.map(c => ({ text: entityNameDisplay(c), value: c }));
    const nodeInfo = [
      { text: 'Single Unspecified Entry', value: 'regular' },
      { text: 'Collection of Unspecified Entries', value: 'set' },
      { text: 'Specific Entry', value: 'curieEnabled' },
    ];
    const nodeTypeText = nodeInfo.find(nodeType => activePanel[nodeType.value]).text;
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
              <LabeledFormGroup
                formLabel={<span>Node Type:</span>}
                value={activePanel.type}
                validateForm={() => this.validateFormElement('type')}
                classNames={classNames}
              >
                <DropdownList
                  filter
                  data={dropDownObjList}
                  textField="text"
                  valueField="value"
                  value={activePanel.type}
                  onChange={value => activePanel.updateField('type', value.value)}
                />
              </LabeledFormGroup>
              <LabeledFormGroup
                formLabel={<span>Treat as:</span>}
                value={activePanel.type}
                validateForm={() => this.validateFormElement('type')}
                classNames={classNames}
              >
                <DropdownList
                  data={nodeInfo}
                  textField="text"
                  valueField="value"
                  value={nodeTypeText}
                  onChange={value => activePanel.changeNodeFunction(value.value, value.text)}
                />
              </LabeledFormGroup>
            </Form>
            {isValidType && curieEnabled &&
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
            {isValidType && store.nodePropertyList[activePanel.type].length > 0 &&
              <NodeProperties activePanel={activePanel} validProperties={toJS(store.nodePropertyList)} />
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
