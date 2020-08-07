import React from 'react';
import { Media, Button } from 'react-bootstrap';

import { FaExternalLinkAlt } from 'react-icons/fa';

import AppConfig from '../../../AppConfig';
import config from '../../../config.json';

const shortid = require('shortid');

class PubmedEntry extends React.Component {
  constructor(props) {
    super(props);

    this.appConfig = new AppConfig(config);

    this.defaultFailureInfo = {
      id: '',
      title: 'Failed to fetch publication information',
      authors: [],
      journal: '',
      source: '',
      pubdate: '',
      url: '',
      doid: '',
    };

    this.getPubmedInfo = this.getPubmedInfo.bind(this);
  }

  getPubmedInfo() {
    const { pub } = this.props;
    let linkUrl = '#';
    let linkDisable = true;
    const paperInfo = pub;
    let info = {
      id: paperInfo.uid,
      title: paperInfo.title,
      authors: paperInfo.authors,
      journal: paperInfo.fulljournalname,
      source: paperInfo.source,
      pubdate: paperInfo.pubdate,
      url: `https://www.ncbi.nlm.nih.gov/pubmed/${paperInfo.uid}/`,
      doid: paperInfo.elocationid,
    };
    if (!info.id) {
      // something went wrong and we got back some wonky object.
      info = this.defaultFailureInfo;
    }
    if (info.url) {
      linkDisable = false;
      linkUrl = info.url;
    }
    let { authors } = info;
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
    return {
      info, linkUrl, linkDisable, authorFrag,
    };
  }

  render() {
    const {
      info, linkUrl, linkDisable, authorFrag,
    } = this.getPubmedInfo();
    return (
      <Media>
        {info.id ?
          <div>
            <Media.Left>
              <Button disabled={linkDisable} onClick={() => window.open(linkUrl, '_blank')}>
                <div style={{ fontSize: '36px' }}>
                  <FaExternalLinkAlt />
                </div>
              </Button>
            </Media.Left>
            <Media.Body>
              <Media.Heading>{info.title || 'Error'}</Media.Heading>
              <p style={{ margin: '2px' }}>{info.journal || 'Cannot get document summary'} - {info.pubdate}</p>
              <p style={{ margin: '2px' }}>{authorFrag}</p>
            </Media.Body>
          </div>
          :
          'Loading...'
        }
      </Media>
    );
  }
}

export default PubmedEntry;
