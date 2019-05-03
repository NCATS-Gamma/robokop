import React from 'react';
import { isObservableArray } from 'mobx';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';

import FaDownload from 'react-icons/lib/fa/download';
import Bars from 'react-icons/lib/fa/bars';

class DownloadButton extends React.Component {
  constructor(props) {
    super(props);

    this.downloadCSV = this.downloadCSV.bind(this);
    this.downloadJSON = this.downloadJSON.bind(this);
    this.downloadCSVSimple = this.downloadCSVSimple.bind(this);
    this.downloadJSONSimple = this.downloadJSONSimple.bind(this);
  }

  // build out csv file when given a full message
  downloadCSV() {
    const { results, fileName } = this.props;

    // get the keys from the first answer, dropping any that start with an underscore
    let answers = Object.keys(results.filteredAnswers[0]).filter(ans => !ans.startsWith('_'));

    const csv = results.filteredAnswers.map((row, i) => {
      const fieldList = answers.map((ans) => {
        if (ans === 'score') {
          return row[ans];
        }
        // if the field is a set
        if (isObservableArray(row[ans])) {
          return row[ans].map(set => `${set.name} (${set.id})`).join(' | ');
        }
        return `${row[ans].toString().replace(/,/g, '')} (${row._original.nodes[ans].id})`;
      });
      return [i + 1, ...fieldList].join(',');
    });
    // we don't want to search for score in the next line of code
    answers.pop();
    // get the type of each node
    answers = answers.map(ans => `${ans}: ${results.filteredAnswers[0]._original.nodes[ans].type}`);
    // add row to the front of the headers, add score back in
    const fields = ['row', ...answers, 'score'];
    csv.unshift(fields);
    const csvText = csv.join('\n');

    const blob = new Blob([csvText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = `${fileName}.csv`;
    a.href = url;
    a.click();
    a.remove();
  }

  // build out a json file when given a full message
  downloadJSON() {
    const { results, fileName } = this.props;
    // the json we want is nested, so we need to dig into it.
    const original = results.filteredAnswers.map(ans => ans._original);
    const json = JSON.stringify(original);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${fileName}.json`;
    a.href = url;
    a.click();
    a.remove();
  }

  // build a csv file given simple results
  downloadCSVSimple() {
    const { results, fileName, source } = this.props;

    let fields = [];
    let csv;
    // the synonymize results are structured differently from everything else
    if (source === 'synonymize') {
      fields = ['synonyms'];
      csv = results.synonyms.map((row, i) => [i + 1, row[0]].join(','));
    } else {
      fields = Object.keys(results[0]);
      csv = results.map((row, i) => {
        const fieldList = fields.map(field => row[field]);
        return [i + 1, ...fieldList].join(',');
      });
    }

    fields = ['row', ...fields];

    csv.unshift(fields);
    const csvText = csv.join('\n');

    const blob = new Blob([csvText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = `${fileName}.csv`;
    a.href = url;
    a.click();
    a.remove();
  }

  // build a json file given simple results
  downloadJSONSimple() {
    const { results, fileName } = this.props;
    // the json is simple, all we need to do is stringify and download
    const json = JSON.stringify(results);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${fileName}.json`;
    a.href = url;
    a.click();
    a.remove();
  }

  render() {
    const { source } = this.props;
    // we need to change which functions to use based on what results we're getting
    // i.e. full message vs. simple
    const isMessage = source === 'message' || source === 'expand';
    // style should change based on which page we're on.
    const style = source === 'message' ?
      { position: 'absolute', top: '-7%', right: '15px' }
      :
      { margin: '10px 0px' };
    const downloadOptions = (
      <Popover id="downloadOptions">
        <Button
          style={{ margin: '10px 5px', display: 'block', width: '100%' }}
          onClick={isMessage ? this.downloadCSV : this.downloadCSVSimple}
        >
          Download as CSV <FaDownload />
        </Button>
        <Button
          style={{ margin: '10px 5px', display: 'block', width: '100%' }}
          onClick={isMessage ? this.downloadJSON : this.downloadJSONSimple}
        >
          Download as JSON <FaDownload />
        </Button>
      </Popover>
    );
    return (
      <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={downloadOptions}>
        <Button style={style} >Download <Bars /></Button>
      </OverlayTrigger>
    );
  }
}

export default DownloadButton;
