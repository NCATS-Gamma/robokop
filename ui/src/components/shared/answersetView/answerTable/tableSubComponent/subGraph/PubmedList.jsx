import React, { useRef } from 'react';
import { AutoSizer, List } from 'react-virtualized';

const styles = {
  list: {
    border: 'none',
    marginTop: '0px',
    outline: 'none',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    padding: '20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    alignItems: 'center',
    fontSize: '15px',
  },
};

const rowHeight = 50;

export default function PubmedList(props) {
  const { publications } = props;
  const list = useRef(null);

  function rowRenderer({
    index,
    key,
    style,
  }) {
    let pmid = publications[index].toString();
    if ((typeof pmid === 'string' || pmid instanceof String) && (pmid.indexOf(':') !== -1)) {
      // pmidStr has a colon, and therefore probably a curie, remove it.
      pmid = pmid.substr(pmid.indexOf(':') + 1);
    }
    const publication = (
      <a href={`https://www.ncbi.nlm.nih.gov/pubmed/?term=${pmid}`} target="_blank" rel="noreferrer">
        {`https://www.ncbi.nlm.nih.gov/pubmed/?term=${pmid}`}
      </a>
    );

    return (
      <div
        style={{ ...style, ...styles.row }}
        key={key}
      >
        {publication}
      </div>
    );
  }

  function noRowsRenderer() {
    return (
      <h5 style={{ padding: '15px' }}>
        No Publications Found
      </h5>
    );
  }

  return (
    <AutoSizer disableHeight defaultWidth={100}>
      {({ width }) => (
        <List
          ref={list}
          style={styles.list}
          height={Math.max(Math.min((publications.length * rowHeight), 320), 100)}
          overscanRowCount={1}
          rowCount={publications.length}
          rowHeight={rowHeight}
          noRowsRenderer={noRowsRenderer}
          rowRenderer={rowRenderer}
          width={width}
        />
      )}
    </AutoSizer>
  );
}
