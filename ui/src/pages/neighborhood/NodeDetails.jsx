import React from 'react';
import {
  ListGroup, ListGroupItem, Panel, Row, Col,
} from 'react-bootstrap';
import shortid from 'shortid';
import entityNameDisplay from '../../utils/entityNameDisplay';

export default function NodeDetails(props) {
  const { details, sources, sourceNode } = props;
  const whitelist = ['name', 'id', 'type'];
  let sortedKeys = [];

  function sortDetails() {
    const keys = Object.keys(details);
    let firstKeys = keys.filter((key) => whitelist.includes(key));
    firstKeys = firstKeys.sort();
    sortedKeys = firstKeys.concat(keys.filter((key) => !whitelist.includes(key)));
    keys.forEach((key) => {
      // true or false aren't showing up in react table, just making them more readable
      if (typeof details[key] === 'boolean') {
        details[key] = details[key] ? 'Yes' : 'No';
      }
    });
  }

  sortDetails();

  return (
    <div>
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">{sourceNode} Details</Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ maxHeight: '300px', overflow: 'auto' }}>
          {sortedKeys.map((key) => (
            <Row key={shortid.generate()} style={{ margin: '20px 0px' }}>
              <Col sm={2} style={{ textAlign: 'right' }}>
                <span style={{ margin: 0, color: 'lightgrey' }}>
                  {entityNameDisplay(key).toUpperCase()}:
                </span>
              </Col>
              <Col sm={9}>
                {Array.isArray(details[key]) ? (
                  <span>{details[key].join(', ')}</span>
                ) : (
                  <span>{details[key].toString()}</span>
                )}
              </Col>
            </Row>
          ))}
        </Panel.Body>
      </Panel>
      <ListGroup>
        {sources.map((source) => (
          <ListGroupItem
            key={shortid.generate()}
            href={source.url}
            target="_blank"
            style={{
              display: 'inline-block', width: '125px', margin: '0px 10px', borderRadius: '4px',
            }}
          >
            {source.label}
            <span style={{ margin: '0px 5px' }}>
              <img src={source.iconUrl} alt={source.label} height={16} width={16} />
            </span>
          </ListGroupItem>
        ))}
      </ListGroup>
    </div>
  );
}
