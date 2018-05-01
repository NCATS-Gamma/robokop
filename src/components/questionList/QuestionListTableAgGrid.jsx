import React from 'react';
import PropTypes from 'prop-types';

import { Panel, FormControl } from 'react-bootstrap';
import { AgGridReact, AgGridColumn } from 'ag-grid-react';

class QuestionListTableAgGrid extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      quickFilterText: '',
    };

    this.onClick = this.onClick.bind(this);
    this.onGridReady = this.onGridReady.bind(this);
    this.onFilterTextChange = this.onFilterTextChange.bind(this);
    this.getRowClass = this.getRowClass.bind(this);

    this.cellRendererAnswersetTimeStamp = this.cellRendererAnswersetTimeStamp.bind(this);
    this.cellRendererAnswers = this.cellRendererAnswers.bind(this);
    this.cellRendererBusy = this.cellRendererBusy.bind(this);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.gridApi.sizeColumnsToFit();

    const sort = [
      { colId: 'isUserOwned', sort: 'desc' },
      { colId: 'latest_answerset_timestamp', sort: 'desc' },
    ];
    this.gridApi.setSortModel(sort);
  }
  onClick() {
    const selectedRow = this.gridApi.getSelectedRows();

    if (Array.isArray(selectedRow) && selectedRow.length > 0) {
      const question = selectedRow[0];
      this.props.callbackQuestionSelect(question);
    }
  }
  onFilterTextChange(event) {
    this.setState({ quickFilterText: event.target.value });
  }
  getRowClass(params) {
    if (params.data.isUserOwned) {
      return 'question-row-is-owned';
    }
    return 'question-row-is-unowned';
  }
  cellRendererAnswersetTimeStamp(params) {
    let out = '';
    if (params.value) {
      const d = Date(params.value);
      out = d.toLocaleString();
    }
    return out;
  }
  cellRendererAnswers(params) {
    let out = '';
    if (params.data !== '' && params.data !== undefined && params.data !== null && params.data.id) {
      // out = <span onClick={() => this.props.callbackAnswersetSelect(params.data.id, params.data.latest_answerset_id)}> AS </span>
      console.log(params)
      out = document.createElement('span');
      out.innerHTML = `<a href=${this.props.answersetUrlFunction(params.data.id, params.data.latest_answerset_id)}>AS</a>`;
    }
    return out;
  }
  cellRendererBusy(params) {
    let out = '';
    if (params.value) {
      out = 'Busy';
    }
    return out;
  }
  cellRendererOwned(params) {
    let out = '';
    if (params.value) {
      out = '*';
    }
    return out;
  }
  render() {
    // { headerName: '', field: 'isBusy', suppressMenu: true, cellRenderer: this.cellRendererBusy, width: 10 },
    // { headerName: 'Updated', field: 'latest_answerset_timestamp', suppressMenu: true, cellRenderer: this.cellRendererAnswersetTimeStamp, width: 100 },
    // { headerName: '', field: 'latest_answerset_id', suppressMenu: true, cellRenderer: this.cellRendererAnswers, width: 10 },
    return (
      <div>
        <Panel>
          <Panel.Heading>
            {this.props.showSearch &&
              <FormControl
                id="filterText"
                type="text"
                placeholder="Search"
                onChange={this.onFilterTextChange}
              />
            }
          </Panel.Heading>
          <Panel.Body>
            <div className="ag-theme-material" style={{ width: '100%', height: this.props.height }}>
              <AgGridReact
                columnDefs={[
                  { headerName: '*', field: 'isUserOwned', suppressMenu: true, cellRenderer: this.cellRendererOwned, width: 5 },
                  { headerName: 'Name', field: 'name', suppressMenu: true },
                  { headerName: 'Question', field: 'natural_question', suppressMenu: true },
                  { headerName: 'Notes', field: 'notes', suppressMenu: true },
                ]}
                rowData={this.props.questions}
                getRowClass={this.getRowClass}
                enableFiltering
                enableSorting

                quickFilterText={this.state.quickFilterText}
                suppressMovableColumns
                defaultColDef={{ width: 100, headerComponentParams: { template: '' } }}
                rowSelection="single"
                onSelectionChanged={this.onClick}
                onGridReady={this.onGridReady}
              />
              <div className="fadeout" />
            </div>
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}

QuestionListTableAgGrid.defaultProps = {
  height: '100px',
  answersetUrlFunction: (q,a) => '',
};

QuestionListTableAgGrid.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  questions: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  showSearch: PropTypes.bool.isRequired,
  callbackQuestionSelect: PropTypes.func.isRequired,
};

export default QuestionListTableAgGrid;
