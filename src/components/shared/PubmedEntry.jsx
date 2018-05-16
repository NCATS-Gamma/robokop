import React from 'react';
import { Media, Button } from 'react-bootstrap';

import GoFileText from 'react-icons/go/file-text';

const shortid = require('shortid');

class PubmedEntry extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      info: {
        id: '',
        title: 'Loading...',
        authors: [],
        journal: '',
        source: '',
        pubdate: '',
        url: '',
        doid: '',
      },
    };

    this.defaultInfo = {
      id: '',
      title: 'Unable to fetch publication information',
      authors: [],
      journal: '',
      source: '',
      pubdate: '',
      url: '',
      doid: '',
    };
  }

  componentDidMount() {
    this.getPubmedInformation(this.props.pmid);
  }

  getPubmedInformation(pmid) {
    const pmidNum = pmid.substr(pmid.indexOf(':') + 1);
    const postUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
    const postData = { db: 'pubmed', id: pmidNum.toString(), version: '2.0', retmode: 'json' };

    const defaultInfo = Object.assign({}, this.defaultFailureInfo);
    $.post(postUrl, postData, (data) => {
      let info = defaultInfo;
      if (pmidNum in data.result) {
        const paperInfo = data.result[pmidNum];
        info = {
          id: pmid,
          title: paperInfo.title,
          authors: paperInfo.authors,
          journal: paperInfo.fulljournalname,
          source: paperInfo.source,
          pubdate: paperInfo.pubdate,
          url: `https://www.ncbi.nlm.nih.gov/pubmed/${pmidNum}/`,
          doid: paperInfo.elocationid,
        };
      }
      this.setState({ info });
    }).fail(() => {
      const info = defaultInfo;

      this.setState({ info });
    });
  }

  render() {
    let linkUrl = '#';
    let linkDisable = true;
    if (this.state.info.url) {
      linkDisable = false;
      linkUrl = this.state.info.url;
    }
    let authors = this.state.info.authors;
    if (authors == null) {
      authors = [];
    }
    const authorFrag = authors.map((a, ind, as) => {
      let comma = ', ';
      if ((ind + 1) === as.length) {
        comma = '';
      }
      return (
        <span key={shortid.generate()}>
          {a.name}{comma}
        </span>
      );
    });

    return (
      <Media>
        <Media.Left>
          <Button disabled={linkDisable} onClick={() => window.open(linkUrl, '_blank')}>
            <GoFileText />
          </Button>
        </Media.Left>
        <Media.Body>
          <Media.Heading>{this.state.info.title}</Media.Heading>
          <p style={{ margin: '2px' }}>{this.state.info.journal} - {this.state.info.pubdate}</p>
          <p style={{ margin: '2px' }}>{authorFrag}</p>
        </Media.Body>
      </Media>
    );
  }
}

export default PubmedEntry;
