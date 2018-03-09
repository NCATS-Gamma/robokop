import React from 'react';
import PropTypes from 'prop-types';

import { AutoSizer, Grid } from 'react-virtualized';

class AnswersetGrid extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      card: {
        marginTop: '10px',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem',
        width: '70px',
        fontSize: 12,
        color: 'black',
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      },
    };
  }

  getColor(ind) {
    const colors = [
      '#8dd3c7',
      '#ffffb3',
      '#bebada',
      '#fb8072',
      '#80b1d3',
      '#fdb462',
      '#b3de69',
      '#fccde5',
      '#d9d9d9',
      '#bc80bd',
      '#ccebc5',
      '#ffed6f',
    ];

    return colors[ind % colors.length]
  }

  render() {
    const colWidth=100;
    const height=110;
    const rowHeight=80;
    const numColumns = this.props.answersets.length;

    const cellRenderer = ({
      columnIndex,
      key,
      rowIndex,
      style,
    }) => {
      const isReady = true;
      let thisColor = '#eee';
      let thisOnClick = () => {};
      if (isReady) {
        thisColor = this.getColor(columnIndex);
        thisOnClick = () => this.props.callbackAnswersetOpen(this.props.answersets[columnIndex]);
      }
      const thisStyle = { backgroundColor: thisColor, height: rowHeight };

      return (
        <div key={key} style={{ ...style, ...this.styles.card, ...thisStyle }} onClick={thisOnClick}>
          {new Date(this.props.answersets[columnIndex].timestamp).toLocaleString()}
        </div>
      );
    };

    
    return (
      <div style={{ minHeight: this.props.height }}>
        <AutoSizer>
          {({ height, width }) => (
            <Grid
              cellRenderer={cellRenderer}
              columnCount={numColumns}
              columnWidth={colWidth}
              height={height}
              rowCount={1}
              rowHeight={rowHeight}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
    );
  }
}

AnswersetGrid.defaultProps = {
  height: '125px',
};

AnswersetGrid.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  answersets: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  callbackAnswersetOpen: PropTypes.func.isRequired,
};

export default AnswersetGrid;
