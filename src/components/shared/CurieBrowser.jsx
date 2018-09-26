import React from 'react';
import PropTypes from 'prop-types';

// import { Button } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';

import curieUrls from '../util/curieUrls';

const shortid = require('shortid');

const propTypes = {
  curieList: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    label: PropTypes.string,
    curie: PropTypes.string.isRequired,
  })).isRequired,
  defaults: PropTypes.shape({
    type: PropTypes.string,
    label: PropTypes.string,
  }),
  width: PropTypes.number,
};

const defaultProps = {
  width: 0, // will be ignored
  defaults: {
    type: '<N/A>',
    label: '<N/A>',
  },
};

class CurieBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.rowRenderer = this.rowRenderer.bind(this);
    this.renderEmpty = this.renderEmpty.bind(this);
    this.renderCurieList = this.renderCurieList.bind(this);
  }

  rowRenderer({
    index,
    key,
    style,
  }) {
    const d = this.props.curieList[index];
    let { type, label } = this.props.defaults;
    const { curie } = d;
    if (Object.hasOwnProperty.call(d, 'type')) {
      type = d.type; // eslint-disable-line prefer-destructuring
    }
    if (Object.hasOwnProperty.call(d, 'label')) {
      label = d.label; // eslint-disable-line prefer-destructuring
    }

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
          backgroundColor: '#fff',
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
            verticalAlign: 'middle',
            ...maxWidth,
          }}
        >
          {type}
        </div>
        <div
          style={{
            display: 'table-cell',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            verticalAlign: 'middle',
            ...maxWidth,
          }}
        >
          {label}
        </div>
        <div style={{ display: 'table-cell', width: '150px', verticalAlign: 'middle' }}>
          {curie}
        </div>
        <div
          style={{
            display: 'table-cell',
            width: '73px',
            verticalAlign: 'middle',
          }}
        >
          {links}
        </div>
      </div>
    );
  }

  renderEmpty() {
    return (
      <div style={{ color: '#ccc', padding: '10px' }}>
        <span>
          No Curies found.
        </span>
      </div>
    );
  }
  renderCurieList() {
    const rowHeight = 50;
    const nRows = this.props.curieList.length;
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
    const hasData = Array.isArray(this.props.curieList) && this.props.curieList.length > 0;
    return (
      <div style={{ outline: '1px solid #e0e0e0' }}>
        {!hasData && this.renderEmpty()}
        {hasData && this.renderCurieList()}
      </div>
    );
  }
}

CurieBrowser.propTypes = propTypes;
CurieBrowser.defaultProps = defaultProps;

export default CurieBrowser;
