import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import PubmedEntry from './PubmedEntry';

import AppConfig from '../../../AppConfig';
import config from '../../../config.json';

class PubmedList extends React.Component {
  constructor(props) {
    super(props);

    this.appConfig = new AppConfig(config);

    this.styles = {
      list: {
        border: 'none',
        marginTop: '0px',
        outline: 'none',
      },
      row: {
        display: 'flex',
        flexDirection: 'row',
        padding: '5px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
      },
    };

    this.state = {
      pubs: {},
    };

    this.noRowsRenderer = this.noRowsRenderer.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
  }

  componentWillUnmount() {
    this.appConfig.cancelToken.cancel('Pubmed request canceled');
  }

  rowRenderer({
    index,
    key,
    style,
    isScrolling,
  }) {
    let pmid = this.props.publications[index].toString();
    if ((typeof pmid === 'string' || pmid instanceof String) && (pmid.indexOf(':') !== -1)) {
      // pmidStr has a colon, and therefore probably a curie, remove it.
      pmid = pmid.substr(pmid.indexOf(':') + 1);
    }
    let publication = 'Loading...';
    if (this.state.pubs[index]) {
      publication = <PubmedEntry pub={this.state.pubs[index]} />;
    } else if (!isScrolling) {
      this.appConfig.getPubmedPublications(
        pmid,
        (pub) => {
          const { pubs } = this.state;
          pubs[index] = pub;
          this.list.forceUpdateGrid();
          this.setState({ pubs });
        },
        (err) => {
          if (err.message !== 'Pubmed request canceled') {
            console.log('error', err);
          }
        },
      );
    }
    return (
      <div
        style={{ ...style, ...this.styles.row }}
        key={key}
      >
        {publication}
      </div>
    );
  }
  noRowsRenderer() {
    return (
      <Row>
        <Col md={12}>
          <h5 style={{ padding: '15px' }}>
            {'No Publications Found'}
          </h5>
        </Col>
      </Row>
    );
  }

  render() {
    const rowCount = this.props.publications.length;
    const listHeight = Math.max(Math.min((rowCount * 100), 500), 100);
    return (
      <AutoSizer disableHeight defaultWidth={100}>
        {({ width }) => (
          <List
            ref={(ref) => { this.list = ref; }}
            style={this.styles.list}
            height={listHeight}
            overscanRowCount={1}
            rowCount={rowCount}
            rowHeight={100}
            noRowsRenderer={this.noRowsRenderer}
            rowRenderer={this.rowRenderer}
            width={width}
          />
        )}
      </AutoSizer>
    );
  }
}

export default PubmedList;
