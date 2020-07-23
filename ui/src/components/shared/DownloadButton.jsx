import React from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';

import { FaDownload, FaBars } from 'react-icons/fa';

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
    let { columnHeaders, answers } = results.answerSetTableData;
    if (results.filteredAnswers.length) {
      answers = results.filteredAnswers;
    }

    // get the keys from the first answer, dropping any that start with an underscore
    const answerKeys = Object.keys(answers[0]).filter(ans => !ans.startsWith('_') && ans !== 'id');

    const csv = answers.map((row, i) => {
      const fieldList = answerKeys.map((ansKey) => {
        if (ansKey === 'score') {
          return row.score;
        }
        // if the field is a set
        if (!Array.isArray(row[ansKey])) {
          row = row._original;
        }
        return row[ansKey].map(set => `${set.name.replace(/,/g, '')} (${set.id})`).join(' | ');
      });
      return [i + 1, ...fieldList].join(',');
    });
    columnHeaders = columnHeaders.map(header => header.Header);
    // add row to the front of the headers, add score
    const headers = ['row', ...columnHeaders, 'score'].join(',');
    csv.unshift(headers);
    const csvText = csv.join('\n');

    const blob = new Blob([csvText], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = `${fileName}.csv`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // build out a json file when given a full message
  downloadJSON() {
    const { results, fileName } = this.props;
    let { answers } = results.answerSetTableData;
    if (results.filteredAnswers.length) {
      answers = results.filteredAnswers;
    }
    if (answers[0]._original) {
      // the json we want is nested, so we need to dig into it.
      answers = answers.map(ans => ans._original);
    }
    const json = JSON.stringify(answers);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${fileName}.json`;
    a.href = url;
    document.body.appendChild(a);
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
    document.body.appendChild(a);
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
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  render() {
    const { source } = this.props;
    // we need to change which functions to use based on what results we're getting
    // i.e. full message vs. simple
    const isMessage = source === 'message' || source === 'expand';
    // style should change based on which page we're on.
    const style = { position: 'absolute', top: '-44px', right: 0 };
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
        <Button style={style} >Download <FaBars /></Button>
      </OverlayTrigger>
    );
  }
}

export default DownloadButton;
