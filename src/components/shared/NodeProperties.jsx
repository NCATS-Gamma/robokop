import React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { Combobox } from 'react-widgets';
import FaPlus from 'react-icons/lib/fa/plus';


@observer
class NodeProperties extends React.Component {
  render() {
    const { activePanel } = this.props;
    return (
      <div style={{ margin: '10px 0px', display: 'flex', flexDirection: 'column' }} >
        {activePanel.properties.length > 0 &&
          <div>
            <div style={{ width: '48%', textAlign: 'center', display: 'inline-block' }}>Property Name:</div>
            <div style={{ width: '48%', textAlign: 'center', display: 'inline-block' }}>Property Value:</div>
          </div>
        }
        {activePanel.properties.map((property, i) => (
          <div
            key={['property', i].join('_')}
            style={{ display: 'flex' }}
          >
            <Combobox
              // TODO: this will be coming from the backend
              data={[]}
              value={property[0]}
              onChange={value => activePanel.updateProperty(value, i, 'key')}
              style={{ width: '48%', margin: 'auto 5px' }}
            />
            <Combobox
              // TODO: this will be coming from the backend
              data={[]}
              value={property[1]}
              onChange={value => activePanel.updateProperty(value, i, 'value')}
              style={{ width: '48%', margin: 'auto 5px' }}
            />
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
            <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Property'}
          </Button>
        </div>
      </div>
    );
  }
}

export default NodeProperties;
