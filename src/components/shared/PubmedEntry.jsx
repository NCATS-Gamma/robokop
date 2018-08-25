import React from 'react';
import { Media, Button } from 'react-bootstrap';

import FaExternalLink from 'react-icons/lib/fa/external-link';

const shortid = require('shortid');


const makeCancelable = (promise) => {
  let hasCanceled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      val => (hasCanceled ? reject(new Error('canceled')) : resolve(val)),
      error => (hasCanceled ? reject(new Error('canceled')) : reject(error)),
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled = true;
    },
  };
};

class PubmedEntry extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      isFailure: false,
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

    this.updatePromise = new Promise(() => {});
    this.updateInformation = this.updateInformation.bind(this);
    this.getPubmedInformation = this.getPubmedInformation.bind(this);
  }

  componentDidMount() {
    this.updatePromise = this.updateInformation(this.props);
    this.updatePromise.promise
      .then(newState => this.setState(newState))
      .catch(() => {});
  }

  componentWillReceiveProps(newProps) {
    if (newProps.pmid !== this.props.pmid) {
      this.updatePromise = this.updateInformation(newProps);

      this.updatePromise.promise
        .then(newState => this.setState(newState))
        .catch(() => {});
    }
  }

  componentWillUnmount() {
    try {
      this.updatePromise.cancel();
    } catch (err) {
      // Nothing
    }
  }

  getPubmedInformation(pmid) {
    const pmidNum = pmid.substr(pmid.indexOf(':') + 1);
    const postUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
    const postData = {
      db: 'pubmed',
      id: pmidNum.toString(),
      version: '2.0',
      retmode: 'json',
    };

    return new Promise((resolve, reject) => $.post(postUrl, postData, response => resolve(response)).fail(response => reject(response)));
  }
  updateInformation(newProps) {
    const { pmid } = newProps;

    return makeCancelable(this.getPubmedInformation(pmid)
      .then((response) => {
        const data = response.result;
        const pmidNum = pmid.substr(pmid.indexOf(':') + 1);
        if (pmidNum in data) {
          const paperInfo = data[pmidNum];
          let info = Object.assign({}, this.defaultFailureInfo);
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
          return { info, ready: true, isFailure: false };
        }
        throw new Error('Bad response from https://www.ncbi.nlm.nih.gov/pubmed');
      })
      .catch((err) => {
        console.log('Error fetching from pubmed', err);
        return { info: Object.assign({}, this.defaultFailureInfo), isFailure: true };
      }));
  }

  renderFailure() {
    return (
      <div style={{ color: '#ccc' }}>
        Failed to retrieve publication information
      </div>
    );
  }

  renderLoading() {
    return (
      <div style={{ color: '#ccc' }}>
        Loading...
      </div>
    );
  }

  renderValid() {
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
            <div style={{ fontSize: '36px' }}>
              <FaExternalLink />
            </div>
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
  render() {
    const { ready, isFailure } = this.state;
    return (
      <div>
        {!ready && !isFailure && this.renderLoading()}
        {!ready && isFailure && this.renderFailure()}
        {ready && this.renderValid()}
      </div>
    );
  }
}

export default PubmedEntry;
