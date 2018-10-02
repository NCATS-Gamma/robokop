import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormControl, FormGroup, Col, ControlLabel } from 'react-bootstrap';
import FaSpinner from 'react-icons/lib/fa/spinner';
import { toJS } from 'mobx';
import { observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { Multiselect, DropdownList } from 'react-widgets';

// import AppConfig from './../../AppConfig';
import Loading from './../Loading';
import LabeledFormGroup from './../shared/LabeledFormGroup';

const classNames = {
  formLabel: 'col-md-2 form-label',
  formControl: 'col-md-10',
};

const propTypes = {
  activePanel: PropTypes.shape({
    id: PropTypes.number.isRequired,
    source_id: PropTypes.number.isRequired,
    target_id: PropTypes.number.isRequired,
    predicate: mobxPropTypes.observableArrayOf(PropTypes.string),
  }).isRequired,
};

// @inject(({ store }) => ({ store }))
@observer
class EdgePanel extends React.Component {
  constructor(props) {
    super(props);

    this.validateFormElement = this.validateFormElement.bind(this);
    // this.onChangeInputLabel = this.onChangeInputLabel.bind(this);
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

  renderLoading() {
    return (
      <Loading />
    );
  }

  renderLoaded() {
    const { activePanel } = this.props;
    const validNodeSelectionList = activePanel.store.visibleNodePanels.map(panel => ({ id: panel.id, label: panel.panelName }));
    const { predicateList, awaitingPredicateList, predicateFetchError } = activePanel.store;
    // Determine default message for predicate selection component
    let predicateInputMsg = 'Enter optional predicate(s)...';
    if (awaitingPredicateList) { // awaiting status overrides error status which may be stale
      predicateInputMsg = 'Fetching possible predicates for edge...';
    } else if (predicateFetchError) {
      predicateInputMsg = predicateFetchError;
    }
    return (
      <div>
        <Form horizontal>
          <FormGroup controlId="formHorizontalNodeIdName">
            <Col componentClass={ControlLabel} sm={2}>
              Edge Id
            </Col>
            <Col sm={1}>
              <FormControl
                type="text"
                value={activePanel.id}
                disabled
              />
            </Col>
          </FormGroup>
          <LabeledFormGroup
            formLabel={<span>Edge Source </span>}
            value={activePanel.source_id}
            validateForm={() => this.validateFormElement('source_id')}
            classNames={classNames}
          >
            <DropdownList
              filter="contains"
              // dropUp
              // disabled={disableType}
              // style={{ display: 'table-cell', verticalAlign: 'middle', width: '200px' }}
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
                allowCreate="onFilter"
                onCreate={name => activePanel.updatePredicate(name)}
                data={awaitingPredicateList ? [] : toJS(predicateList)}
                busy={awaitingPredicateList}
                busySpinner={<FaSpinner className="icon-spin" />}
                disabled={awaitingPredicateList || !!predicateFetchError}
                placeholder={predicateInputMsg}
                value={toJS(activePanel.predicate)}
                filter="contains"
                onChange={value => activePanel.updateField('predicate', value)}
                containerClassName={activePanel.isValidPredicate ? 'valid' : 'invalid'}
                messages={{
                  emptyList: 'Enter predicate tag',
                  createOption: props => <span>{'Create new predicate tag '}<strong>{`"${props.searchTerm}"`}</strong></span>,
                }}
              />
            </Col>
          </FormGroup>
        </Form>
      </div>
    );
  }

  render() {
    const { store } = this.props.activePanel;
    const ready = store.dataReady && store.conceptsReady && store.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

EdgePanel.propTypes = propTypes;

export default EdgePanel;
