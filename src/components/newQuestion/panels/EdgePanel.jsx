import React from 'react';
import PropTypes from 'prop-types';
import { Form, Col, Glyphicon } from 'react-bootstrap';
import FaSpinner from 'react-icons/lib/fa/spinner';
import { toJS } from 'mobx';
import { observer, PropTypes as mobxPropTypes } from 'mobx-react';
import { Multiselect, DropdownList } from 'react-widgets';

import Loading from '../../Loading';

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
              <Col sm={5}>
                <h4 style={{ color: '#CCCCCC' }}>SOURCE</h4>
                <DropdownList
                  filter="contains"
                  data={validNodeSelectionList}
                  textField="label"
                  valueField="id"
                  value={activePanel.source_id}
                  onChange={value => activePanel.updateField('source_id', value.id)}
                  containerClassName={activePanel.isValidSource ? 'valid' : 'invalid'}
                />
              </Col>
              <Col sm={2} id="edgeArrow">
                <Glyphicon glyph="arrow-right" />
              </Col>
              <Col sm={5}>
                <h4 style={{ color: '#CCCCCC' }}>TARGET</h4>
                <DropdownList
                  filter="contains"
                  data={validNodeSelectionList}
                  textField="label"
                  valueField="id"
                  value={activePanel.target_id}
                  onChange={value => activePanel.updateField('target_id', value.id)}
                  containerClassName={activePanel.isValidTarget ? 'valid' : 'invalid'}
                />
              </Col>
              <Col sm={12} style={{ marginTop: '40px' }}>
                <h4 style={{ color: '#CCCCCC' }}>PREDICATES</h4>
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
