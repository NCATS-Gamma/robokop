import React from 'react';
import ReactJson from 'react-json-view';

export default function JsonView(props) {
  const { rowData } = props;
  return (
    <div style={{ margin: '10px 0px 10px 125px' }}>
      <ReactJson
        name={false}
        theme="rjv-default"
        collapseStringsAfterLength={110}
        indentWidth={2}
        iconStyle="triangle"
        src={rowData}
        displayDataTypes={false}
        collapsed={4}
      />
    </div>
  );
}