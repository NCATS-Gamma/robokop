import React from 'react';

import { Button, Badge } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';

import curieUrls from '../../../utils/curieUrls';
import getNodeTypeColorMap from '../../../utils/colorUtils';
import entityNameDisplay from '../../../utils/entityNameDisplay';

const shortid = require('shortid');

const defaultProps = {
  thinking: false,
  data: [],
  disableTypeFilter: true,
  type: 'disease',
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
    const types = d.type.slice();
    const degree = d.degree;

    // types is a list of all the types for this node.
    // We want to assign a set of color stripes to the row in the search table corresponding to these types
    // First lets remove named_thing because it includes verything
    const removeIndex = types.indexOf('named_thing');
    if (removeIndex >= 0) {
      types.splice(removeIndex, 1);
    }

    // The goal is a list of up to 5 colors (by default white)
    const nTotalStripes = 5;
    const colors = new Array(nTotalStripes);
    colors.fill('#fff');
    const selectedTypes = new Array(nTotalStripes);
    selectedTypes.fill('');
    let nUsedColors = 0;

    const theseConcepts = this.props.concepts.slice();

    let conceptFoundIndex = -1;
    let foundIndex = -1;
    if (!this.props.disableTypeFilter) {
      // We are biased towards a particular type
      // Let's search for that one first
      foundIndex = types.indexOf(this.props.type);
      if (foundIndex >= 0) {
        // We have this type
        colors[nUsedColors] = this.nodeTypeColorMap(this.props.type);
        selectedTypes[nUsedColors] = this.props.type;
        nUsedColors += 1;

        types.splice(foundIndex, 1);
      }

      // Remove this type from further consideration
      conceptFoundIndex = theseConcepts.indexOf(this.props.type);
      if (conceptFoundIndex >= 0) {
        theseConcepts.splice(conceptFoundIndex, 1);
      }
    }

    // To find other colors for these types we will go through all concepts in order
    theseConcepts.forEach((concept) => {
      foundIndex = types.indexOf(concept);
      if (foundIndex >= 0 && nUsedColors < nTotalStripes) {
        // We have this type and we have more color stripes available
        colors[nUsedColors] = this.nodeTypeColorMap(concept);
        selectedTypes[nUsedColors] = concept;
        nUsedColors += 1;
      }
    });

    const stripes = colors.map((c, ind) => (
      <div
        title={entityNameDisplay(selectedTypes[ind])}
        style={{
          display: 'table-cell',
          height: '100%',
          width: '5px',
          backgroundColor: c,
        }}
        key={shortid.generate()}
      />
    ));

    const urls = curieUrls(curie);
    const links = (
      <span>
        {urls.map(u => (
          <a target="_blank" href={u.url} alt={u.label} key={shortid.generate()} style={{ paddingRight: '3px' }}><img src={u.iconUrl} alt={u.label} height={16} width={16} /></a>
        ))}
      </span>
    );

    const maxWidth = this.props.width ? { maxWidth: `${this.props.width - 440}px` } : {}; // sum of other columns below plus a little pad

    return (
      <div
        key={key}
        style={{
          ...style,
          display: 'table',
          padding: 0,
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {stripes}
        <div
          style={{
            display: 'table-cell',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            ...maxWidth,
            verticalAlign: 'middle',
            paddingLeft: 10,
          }}
        >
          {name}
        </div>
        <div style={{
          display: 'table-cell',
          width: '150px',
          verticalAlign: 'middle',
          }}
        >
          {curie}
        </div>
        <div style={{
          display: 'table-cell',
          width: '50px',
          verticalAlign: 'middle',
          }}
        >
          <span
            title={`${degree} known connections`}
          >
            <Badge>{degree}</Badge>
          </span>
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
        <div
          style={{
            display: 'table-cell',
            width: '50px',
            verticalAlign: 'middle',
            paddingRight: 10,
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

BionamesBrowser.defaultProps = defaultProps;

export default BionamesBrowser;
