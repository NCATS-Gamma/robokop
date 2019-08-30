import React from 'react';
import PropTypes from 'prop-types';
import { Form, Col, Glyphicon, Badge } from 'react-bootstrap';
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
    predicate: mobxPropTypes.observableArrayOf(PropTypes.object),
  }).isRequired,
};

const listItem = ({ item }) => (
  <div className="listItem">
    {item.name}
    <Badge>{item.degree}</Badge>
  </div>
);

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
    const validNodeSelectionList = store.visibleNodePanels.map(panel => ({ id: panel.id, name: panel.panelName }));
    const targetNodeList = activePanel.targetNodeList.map(panel => ({ id: panel.node.id, name: panel.node.panelName, degree: panel.node.connections }));
    const {
      predicateList, disablePredicates, predicatesReady, connectionsCountReady,
    } = activePanel;
    // Determine default message for predicate selection component
    let predicateInputMsg = 'Choose optional predicate(s)...';
    if (!predicatesReady) {
      predicateInputMsg = 'Loading...';
    } else if (disablePredicates) {
      predicateInputMsg = 'Source and/or Target Nodes need to be specified...';
    }
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
                  itemComponent={listItem}
                  textField="name"
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
                  data={targetNodeList}
                  readOnly={!connectionsCountReady}
                  busy={!connectionsCountReady}
                  busySpinner={<FaSpinner className="icon-spin" />}
                  itemComponent={listItem}
                  textField="name"
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
                  busy={!predicatesReady}
                  data={toJS(predicateList)}
                  itemComponent={listItem}
                  busySpinner={<FaSpinner className="icon-spin" />}
                  placeholder={predicateInputMsg}
                  textField="name"
                  value={toJS(activePanel.predicate)}
                  filter="contains"
                  onChange={value => activePanel.updatePredicate(value)}
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
