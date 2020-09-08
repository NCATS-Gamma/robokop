import React, { useEffect } from 'react';
import {
  Form, Col, Glyphicon, Badge, Button,
} from 'react-bootstrap';
import { FaSpinner } from 'react-icons/fa';
import { Multiselect, DropdownList } from 'react-widgets';

const listItem = ({ item }) => (
  <div className="listItem">
    {item.name}
    {item.degree !== undefined && (
      <Badge>{item.degree}</Badge>
    )}
  </div>
);

export default function EdgePanel(props) {
  const { panelStore } = props;
  const { edge } = panelStore;

  /**
   * Cancel any calls in progress
   */
  // useEffect(() => () => {
  //   edge.cancelConnectionsCall();
  //   edge.cancelPredicatesCall();
  // }, []);

  const validNodeSelectionList = panelStore.query_graph.nodes.filter((n) => !n.deleted);
  console.log(validNodeSelectionList);
  const {
    predicateList, targetNodeList, disablePredicates, predicatesReady, connectionsCountReady,
    source_id, target_id,
  } = panelStore.edge;
  // Determine default message for predicate selection component
  let predicateInputMsg = 'Choose optional predicate(s)...';
  if (!predicatesReady) {
    predicateInputMsg = 'Loading...';
  } else if (disablePredicates) {
    predicateInputMsg = 'Source and/or Target Nodes need to be specified...';
  }
  const disabledSwitch = source_id === null || target_id === null;
  return (
    <Form horizontal>
      <Col sm={5}>
        <h4 style={{ color: '#CCCCCC' }}>SOURCE</h4>
        <DropdownList
          filter="contains"
          data={validNodeSelectionList}
          itemComponent={listItem}
          textField="name"
          valueField="id"
          value={edge.source_id}
          onChange={(value) => edge.updateField('source_id', value.id)}
          containerClassName={edge.isValidSource ? 'valid' : 'invalid'}
        />
      </Col>
      <Col sm={2} id="nodesSwitch">
        <Button
          onClick={edge.switchSourceTarget}
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
          value={edge.target_id}
          onChange={(value) => edge.updateField('target_id', value.id)}
          containerClassName={edge.isValidTarget ? 'valid' : 'invalid'}
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
          value={edge.predicate}
          valueField={(value) => value.name || value}
          onChange={(value) => edge.updatePredicate(value)}
          containerClassName={edge.isValidPredicate ? 'valid' : 'invalid'}
          messages={{
            emptyList: 'No predicates were found',
          }}
        />
      </Col>
    </Form>
  );
}
