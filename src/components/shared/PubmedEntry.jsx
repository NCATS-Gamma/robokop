import React from 'react';
import { Media, Button } from 'react-bootstrap';

import FaExternalLink from 'react-icons/lib/fa/external-link';

import AppConfig from '../../AppConfig';
import { config } from '../../index';

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

    this.makePubmedObj = this.makePubmedObj.bind(this);
    this.makeDoiObj = this.makeDoiObj.bind(this);
    this.getPubmedInfo = this.getPubmedInfo.bind(this);
    this.getDisplayDate = this.getDisplayDate.bind(this);
  }

  makePubmedObj(publication) {
    return {
      id: publication.uid,
      title: publication.title,
      authors: publication.authors.map(author => author.name),
      journal: publication.fulljournalname,
      source: publication.source,
      pubdate: publication.pubdate,
      url: `https://www.ncbi.nlm.nih.gov/pubmed/${publication.uid}/`,
      doid: publication.elocationid,
    };
  }

  getDisplayDate(year, month, day) {
    let date = '';
    // sometimes we only get year or year and month
    const monthIndex = month !== undefined ? month - 1 : undefined;
    if (year && monthIndex !== undefined && day !== undefined) {
      date = new Date(year, monthIndex, day);
      return `${date.getFullYear()} ${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
    } else if (year && monthIndex !== undefined && day === undefined) {
      date = new Date(year, monthIndex);
      return `${date.getFullYear()} ${date.toLocaleString('default', { month: 'short' })}`;
    } else if (year && monthIndex === undefined && day === undefined) {
      return year;
    }
    return 'Unknown publish date.';
  }

  makeDoiObj(publication) {
    const authors = publication.author ? publication.author.map(author => (`${author.family} ${author.given}`)) : [];
    let [year, month, day] = [];
    if ('published-online' in publication) {
      // grab date from first item in list of date-parts
      ([[year, month, day]] = publication['published-online']['date-parts']);
    } else if ('published-print' in publication) {
      // grab date from first item in list of date-parts
      ([[year, month, day]] = publication['published-print']['date-parts']);
    }
    const publishedDate = this.getDisplayDate(year, month, day);
    return {
      id: publication.DOI,
      title: publication.title[0],
      authors,
      journal: publication.publisher,
      source: publication['publisher-location'],
      pubdate: publishedDate,
      url: publication.URL,
      doid: '',
    };
  }

  getPubmedInfo() {
    const { pub } = this.props;
    let info = this.defaultFailureInfo;
    if ('uid' in pub) {
      info = this.makePubmedObj(pub);
    } else if ('DOI' in pub) {
      info = this.makeDoiObj(pub);
    }
    let { authors } = info;
    if (authors == null) {
      authors = [];
    }
    const authorFrag = authors.join(', ');
    return {
      info, authorFrag,
    };
  }

  render() {
    const {
      info, authorFrag,
    } = this.getPubmedInfo();
    return (
      <Media>
        {info.id ?
          <div>
            <Media.Left>
              <Button disabled={!info.url} onClick={() => window.open(info.url, '_blank')}>
                <div style={{ fontSize: '36px' }}>
                  <FaExternalLink />
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
