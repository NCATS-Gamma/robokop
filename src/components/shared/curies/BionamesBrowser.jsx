import React from 'react';
import PropTypes from 'prop-types';

import { Button } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';

import curieUrls from '../../util/curieUrls';
import getNodeTypeColorMap from '../../util/colorUtils';

const shortid = require('shortid');

const propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
  })),
  thinking: PropTypes.bool,
  // type: PropTypes.string,
  onSelect: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

const defaultProps = {
  thinking: false,
  data: [],
  // type: 'Disease',
  onSelect: () => {},
  width: 0, // will be ignored
};

class BionamesBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.rowRenderer = this.rowRenderer.bind(this);
    this.renderThinking = this.renderThinking.bind(this);
    this.renderEmpty = this.renderEmpty.bind(this);
    this.renderOptions = this.renderOptions.bind(this);

    this.nodeTypeColorMap = getNodeTypeColorMap(props.concepts);
  }

  rowRenderer({
    index,
    key,
    style,
  }) {
    const d = this.props.data[index];
    const curie = d.value;
    const name = d.label;
    const types = d.type;
    const type = types[types.length - 1];
    const color = this.nodeTypeColorMap[type];

    const urls = curieUrls(curie);
    const links = (
      <span>
        {urls.map(u => (
          <a target="_blank" href={u.url} alt={u.label} key={shortid.generate()} style={{ paddingRight: '3px' }}><img src={u.iconUrl} alt={u.label} height={16} width={16} /></a>
        ))}
      </span>
    );

    const maxWidth = this.props.width ? { maxWidth: `${this.props.width - 275}px` } : {}; // sum of other columns below plus a little pad

    return (
      <div
        key={key}
        style={{
          ...style,
          display: 'table',
          padding: '5 10',
          backgroundColor: color,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <div
          style={{
            display: 'table-cell',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            ...maxWidth,
          }}
        >
          {name}
        </div>
        <div style={{ display: 'table-cell', width: '150px' }}>
          {curie}
        </div>
        <div
          style={{
            display: 'table-cell',
            width: '73px',
          }}
        >
          {links}
        </div>
        <div
          style={{
            display: 'table-cell',
            width: '50px',
          }}
        >
          <Button
            onClick={() => this.props.onSelect(d)}
          >
            Select
          </Button>
        </div>
      </div>
    );
  }

  renderThinking() {
    return (
      <div
        style={{
          padding: '10px',
          color: '#ccc',
        }}
      >
        Loading...
      </div>
    );
  }
  renderEmpty() {
    const hasData = Array.isArray(this.props.data);
    return (
      <div>
        {hasData &&
          <div
            style={{
              color: '#ccc',
              padding: '10px',
            }}
          >
            <span>
              No results found.
            </span>
          </div>
        }
      </div>
    );
  }
  renderOptions() {
    const rowHeight = 50;
    const nRows = this.props.data.length;
    const height = Math.min(rowHeight * nRows, 225);
    return (
      <AutoSizer disableHeight defaultWidth={100}>
        {({ width }) => (
          <List
            style={{
              border: 'none',
              marginTop: '0px',
              outline: 'none',
            }}
            height={height}
            overscanRowCount={10}
            rowCount={nRows}
            rowHeight={rowHeight}
            rowRenderer={this.rowRenderer}
            width={width}
          />
        )}
      </AutoSizer>
    );
  }
  render() {
    const hasData = Array.isArray(this.props.data) && this.props.data.length > 0;
    return (
      <div>
        {this.props.thinking && this.renderThinking()}
        {!this.props.thinking && !hasData && this.renderEmpty()}
        {!this.props.thinking && hasData && this.renderOptions()}
      </div>
    );
  }
}

BionamesBrowser.propTypes = propTypes;
BionamesBrowser.defaultProps = defaultProps;

export default BionamesBrowser;
