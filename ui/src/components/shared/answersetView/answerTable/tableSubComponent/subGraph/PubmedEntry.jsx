import React from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import shortid from 'shortid';
import { FaExternalLinkAlt } from 'react-icons/fa';

const defaultFailureInfo = {
  id: '',
  title: 'Failed to fetch publication information',
  authors: [],
  journal: '',
  source: '',
  pubdate: '',
  url: '',
  doid: '',
};

export default function PubmedEntry(props) {
  const { pub } = props;

  function getPubmedInfo() {
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
      info = defaultFailureInfo;
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
          {a.name}
          {comma}
        </span>
      );
    });
    return {
      info, linkUrl, linkDisable, authorFrag,
    };
  }

  const {
    info, linkUrl, linkDisable, authorFrag,
  } = getPubmedInfo();
  return (
    <Card>
      {info.id ? (
        <div>
          <IconButton disabled={linkDisable} onClick={() => window.open(linkUrl, '_blank')}>
            <div style={{ fontSize: '36px' }}>
              <FaExternalLinkAlt />
            </div>
          </IconButton>
          <CardHeader>{info.title || 'Error'}</CardHeader>
          <CardContent>
            <p style={{ margin: '2px' }}>
              {`${info.journal || 'Cannot get document summary'} - ${info.pubdate}`}
            </p>
            <p style={{ margin: '2px' }}>{authorFrag}</p>
          </CardContent>
        </div>
      ) : (
        'Loading...'
      )}
    </Card>
  );
}
