import React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { DropdownList } from 'react-widgets';
import FaPlus from 'react-icons/lib/fa/plus';


@observer
class NodeProperties extends React.Component {
  render() {
    const { activePanel, validProperties } = this.props;
    const listItem = ({ item }) => (
      <span>{item.split(':')[0]}</span>
    );
    return (
      <div style={{ margin: '10px 0px', display: 'flex', flexDirection: 'column' }} >
        {activePanel.properties.length > 0 &&
          <div>
            <div style={{ width: '48%', textAlign: 'center', display: 'inline-block' }}>Constraint:</div>
            <div style={{ width: '48%', textAlign: 'center', display: 'inline-block' }}>Value:</div>
          </div>
        }
        {activePanel.properties.map((property, i) => (
          <div
            key={['property', i].join('_')}
            style={{ display: 'flex' }}
          >
            <DropdownList
              data={validProperties[activePanel.type]}
              itemComponent={listItem}
              value={property.key}
              onChange={value => activePanel.updateProperty(value, i, 'key')}
              style={{ width: '48%', margin: 'auto 5px' }}
              filter="contains"
              placeholder="Choose a constraint"
            />
            <div style={{ width: '48%', margin: 'auto' }}>
              {property.type === 'string' &&
                <input
                  id="propertyValue"
                  style={{
                    width: '100%', margin: '4px', border: '1px solid #CCCCCC', borderRadius: '4px', padding: '6px',
                  }}
                  placeholder="Enter a value here."
                  type="text"
                  onChange={e => activePanel.updateProperty(e.target.value, i, 'value')}
                  value={property.value}
                />
              }
              {property.type === 'boolean' &&
                <DropdownList
                  style={{ width: '100%', margin: 'auto 5px' }}
                  data={[true, false]}
                  onChange={value => activePanel.updateProperty(value, i, 'value')}
                  value={property.value}
                />
              }
              {property.type === 'integer' &&
                <input
                  id="propertyValue"
                  style={{
                    width: '100%', margin: '4px', border: '1px solid #CCCCCC', borderRadius: '4px', padding: '6px',
                  }}
                  type="number"
                  min="0"
                  onChange={e => activePanel.updateProperty(Number(e.target.value), i, 'value')}
                  value={property.value}
                />
              }
              {property.type === 'float' &&
                <input
                  id="propertyValue"
                  style={{
                    width: '100%', margin: '4px', border: '1px solid #CCCCCC', borderRadius: '4px', padding: '6px',
                  }}
                  type="number"
                  min="0"
                  step="0.1"
                  onChange={e => activePanel.updateProperty(Number(e.target.value), i, 'value')}
                  value={property.value}
                />
              }
            </div>
            <div
              style={{
                width: '4%', verticalAlign: 'top', padding: '5px 10px',
              }}
            >
              <Button
                bsStyle="default"
                onClick={() => activePanel.deleteProperty(i)}
                style={{ padding: '8px' }}
              >
                <Glyphicon glyph="trash" />
              </Button>
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center' }}>
          <Button style={{ marginTop: '10px' }} onClick={activePanel.addProperty}>
            <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Constraint'}
          </Button>
        </div>
      </div>
    );
  }
}

export default NodeProperties;
