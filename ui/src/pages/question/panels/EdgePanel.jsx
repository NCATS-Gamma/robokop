import React from 'react';
import {
  Form, Col, Glyphicon, Badge, Button,
} from 'react-bootstrap';
import { FaSpinner } from 'react-icons/fa';
import { Multiselect, DropdownList } from 'react-widgets';

import Loading from '../../../components/shared/Loading';

const listItem = ({ item }) => (
  <div className="listItem">
    {item.name}
    {item.degree !== undefined && (
      <Badge>{item.degree}</Badge>
    )}
  </div>
);

class EdgePanel extends React.Component {
  constructor(props) {
    super(props);

    this.validateFormElement = this.validateFormElement.bind(this);
  }

  componentWillUnmount() {
    const { activePanel } = this.props;
    activePanel.cancelConnectionsCall();
    activePanel.cancelPredicatesCall();
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
    const validNodeSelectionList = store.visibleNodePanels.map((panel) => ({ id: panel.id, name: panel.panelName }));
    const {
      predicateList, targetNodeList, disablePredicates, predicatesReady, connectionsCountReady,
    } = activePanel;
    // Determine default message for predicate selection component
    let predicateInputMsg = 'Choose optional predicate(s)...';
    if (!predicatesReady) {
      predicateInputMsg = 'Loading...';
    } else if (disablePredicates) {
      predicateInputMsg = 'Source and/or Target Nodes need to be specified...';
    }
    const disabledSwitch = activePanel.source_id === null || activePanel.target_id === null;
    return (
      <div>
        {ready ? (
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
                  onChange={(value) => activePanel.updateField('source_id', value.id)}
                  containerClassName={activePanel.isValidSource ? 'valid' : 'invalid'}
                />
              </Col>
              <Col sm={2} id="nodesSwitch">
                <Button
                  onClick={activePanel.switchSourceTarget}
                  id="nodeSwitchButton"
                  disabled={disabledSwitch}
                >
                  <Glyphicon glyph="transfer" />
                </Button>
              </Col>
              <Col sm={5}>
                <h4 style={{ color: '#CCCCCC' }}>TARGET</h4>
                <DropdownList
                  filter="contains"
                  data={targetNodeList}
                  busy={!connectionsCountReady}
                  busySpinner={<FaSpinner className="icon-spin" />}
                  itemComponent={listItem}
                  textField="name"
                  valueField="id"
                  value={activePanel.target_id}
                  onChange={(value) => activePanel.updateField('target_id', value.id)}
                  containerClassName={activePanel.isValidTarget ? 'valid' : 'invalid'}
                />
              </Col>
              <Col sm={12} style={{ marginTop: '40px' }}>
                <h4 style={{ color: '#CCCCCC' }}>PREDICATES</h4>
                <Multiselect
                  filter="contains"
                  allowCreate={false}
                  readOnly={!predicatesReady || disablePredicates}
                  busy={!predicatesReady}
                  data={predicateList}
                  itemComponent={listItem}
                  busySpinner={<FaSpinner className="icon-spin" />}
                  placeholder={predicateInputMsg}
                  textField={(value) => value.name || value}
                  value={activePanel.predicate}
                  valueField={(value) => value.name || value}
                  onChange={(value) => activePanel.updatePredicate(value)}
                  containerClassName={activePanel.isValidPredicate ? 'valid' : 'invalid'}
                  messages={{
                    emptyList: 'No predicates were found',
                  }}
                />
              </Col>
            </Form>
          </div>
        ) : (
          <Loading />
        )}
      </div>
    );
  }
}

export default EdgePanel;
