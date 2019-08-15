import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormGroup, Col, ControlLabel } from 'react-bootstrap';
import FaSpinner from 'react-icons/lib/fa/spinner';
import { toJS } from 'mobx';
import { observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { Multiselect, DropdownList } from 'react-widgets';

import Loading from '../../Loading';
import LabeledFormGroup from '../../shared/LabeledFormGroup';

const classNames = {
  formLabel: 'col-md-2 form-label',
  formControl: 'col-md-10',
};

const propTypes = {
  activePanel: PropTypes.shape({
    id: PropTypes.number.isRequired,
    source_id: PropTypes.number,
    target_id: PropTypes.number,
    predicate: mobxPropTypes.observableArrayOf(PropTypes.string),
  }).isRequired,
};

@observer
class EdgePanel extends React.Component {
  constructor(props) {
    super(props);

    this.validateFormElement = this.validateFormElement.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  /**
   * Return if the specific form element is valid.
   */
  validateFormElement(field) {
    let isValid = false;
    const { activePanel } = this.props;
    switch (field.toLowerCase()) {
      case 'source_id':
        isValid = activePanel.isValidSource;
        break;
      case 'target_id':
        isValid = activePanel.isValidTarget;
        break;
      case 'predicate':
        isValid = activePanel.isValidPredicate;
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
    const ready = store.dataReady && store.conceptsReady && store.userReady && store.predicatesReady;
    const { activePanel } = this.props;
    const validNodeSelectionList = activePanel.store.visibleNodePanels.map(panel => ({ id: panel.id, label: panel.panelName }));
    const { predicateList, disablePredicates } = activePanel;
    // Determine default message for predicate selection component
    const predicateInputMsg = disablePredicates ? 'Source and/or Target Nodes need to be specified...' : 'Enter optional predicate(s)...';
    return (
      <div>
        {ready ?
          <div>
            <Form horizontal>
              <LabeledFormGroup
                formLabel={<span>Edge Source </span>}
                value={activePanel.source_id}
                validateForm={() => this.validateFormElement('source_id')}
                classNames={classNames}
              >
                <DropdownList
                  filter="contains"
                  data={validNodeSelectionList}
                  textField="label"
                  valueField="id"
                  value={activePanel.source_id}
                  onChange={value => activePanel.updateField('source_id', value.id)}
                  containerClassName={activePanel.isValidSource ? 'valid' : 'invalid'}
                />
              </LabeledFormGroup>
              <LabeledFormGroup
                formLabel={<span>Edge Target </span>}
                value={activePanel.target_id}
                validateForm={() => this.validateFormElement('target_id')}
                classNames={classNames}
              >
                <DropdownList
                  filter="contains"
                  data={validNodeSelectionList}
                  textField="label"
                  valueField="id"
                  value={activePanel.target_id}
                  onChange={value => activePanel.updateField('target_id', value.id)}
                  containerClassName={activePanel.isValidTarget ? 'valid' : 'invalid'}
                />
              </LabeledFormGroup>
              <FormGroup controlId="formHorizontalNodeIdName">
                <Col componentClass={ControlLabel} sm={2}>
                  Predicates
                </Col>
                <Col sm={6}>
                  <Multiselect
                    allowCreate={false}
                    onCreate={name => activePanel.updatePredicate(name)}
                    data={toJS(predicateList)}
                    // disabled={disablePredicates}
                    busySpinner={<FaSpinner className="icon-spin" />}
                    placeholder={predicateInputMsg}
                    value={toJS(activePanel.predicate)}
                    filter="contains"
                    onChange={value => activePanel.updateField('predicate', value)}
                    containerClassName={activePanel.isValidPredicate ? 'valid' : 'invalid'}
                    messages={{
                      emptyList: 'No predicates were found',
                    }}
                  />
                </Col>
              </FormGroup>
            </Form>
          </div>
          :
          <Loading />
        }
      </div>
    );
  }
}

EdgePanel.propTypes = propTypes;

export default EdgePanel;
