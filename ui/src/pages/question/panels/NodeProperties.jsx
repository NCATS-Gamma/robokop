import React from 'react';
import { Button, Glyphicon, Table } from 'react-bootstrap';
import { DropdownList } from 'react-widgets';
import { FaPlus } from 'react-icons/fa';

export default function NodeProperties(props) {
  const { activePanel, validProperties } = props;
  const listItem = ({ item }) => (
    <span>{item.split(':')[0]}</span>
  );
  return (
    <div>
      {activePanel.properties.length > 0 && (
        <Table id="nodePropertiesContainer" striped>
          <thead>
            <tr>
              <th className="nodePropertiesHeader">CONSTRAINT</th>
              <th className="nodePropertiesHeader">VALUE</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {activePanel.properties.map((property, i) => (
              <tr key={['property', i].join('_')}>
                <td>
                  <DropdownList
                    data={validProperties[activePanel.type]}
                    itemComponent={listItem}
                    value={property.key}
                    onChange={(value) => activePanel.updateProperty(value, i, 'key')}
                    filter="contains"
                    placeholder="Choose a constraint"
                    containerClassName="constraintInput"
                  />
                </td>
                <td>
                  {(!property.type || property.type === 'string') && (
                    <input
                      id="propertyValue"
                      style={!property.type ? { backgroundColor: '#CCCCCC' } : {}}
                      placeholder="Enter a value here."
                      type="text"
                      onChange={(e) => activePanel.updateProperty(e.target.value, i, 'value')}
                      value={property.value}
                      disabled={!property.type}
                      className="constraintInput"
                    />
                  )}
                  {property.type === 'boolean' && (
                    <DropdownList
                      data={[true, false]}
                      onChange={(value) => activePanel.updateProperty(value, i, 'value')}
                      value={property.value}
                      containerClassName="constraintInput"
                    />
                  )}
                  {property.type === 'integer' && (
                    <input
                      id="propertyValue"
                      type="number"
                      min="0"
                      onChange={(e) => activePanel.updateProperty(Number(e.target.value), i, 'value')}
                      value={property.value}
                      className="constraintInput"
                    />
                  )}
                  {property.type === 'float' && (
                    <input
                      id="propertyValue"
                      type="number"
                      min="0"
                      step="0.1"
                      onChange={(e) => activePanel.updateProperty(Number(e.target.value), i, 'value')}
                      value={property.value}
                      className="constraintInput"
                    />
                  )}
                </td>
                <td>
                  <Button
                    bsStyle="default"
                    onClick={() => activePanel.deleteProperty(i)}
                    style={{ padding: '11px' }}
                  >
                    <Glyphicon glyph="trash" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <Button style={{ marginTop: '10px' }} onClick={activePanel.addProperty}>
          <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Constraint'}
        </Button>
      </div>
    </div>
  );
}
