import React from 'react';
import PropTypes from 'prop-types';

import { Panel, FormControl } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';

import LoadingImg from '../../../assets/images/loading.gif';
import NetworkImg from '../../../assets/images/network.png';

const timestampToDate = (ts) => {
  let ts2 = ts;
  if (ts) {
    if (!ts.endsWith('Z')) {
      ts2 = `${ts}Z`;
    }
    return new Date(ts2);
  }
  return null;
};

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

    this.cellRendererAnswers = this.cellRendererAnswers.bind(this);
    this.cellRendererTaskStatus = this.cellRendererTaskStatus.bind(this);
    this.cellRendererTimestamp = this.cellRendererTimestamp.bind(this);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.gridApi.sizeColumnsToFit();

    const sort = [
      // { colId: 'isUserOwned', sort: 'desc' },
      { colId: 'latest_answerset_timestamp', sort: 'desc' },
    ];
    this.gridApi.setSortModel(sort);
  }
  onClick(event) {
    const clickedColumn = event.column.colId;
    if (clickedColumn === 'latestAnswersetId' && event.node.data.latestAnswersetId) {
      this.props.callbackAnswersetSelect(event.node.data, { id: event.node.data.latestAnswersetId });
    } else if (clickedColumn === 'isBusy') {
      this.props.onClick(event.node.data);
    } else if (clickedColumn !== 'timestamp' && clickedColumn !== 'isUserOwned') {
      this.props.callbackQuestionSelect(event.node.data);
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
  cellRendererAnswers(params) {
    let out = '';
    if (params.data !== '' && params.data !== undefined && params.data !== null && 'id' in params.data && params.data.id && 'latestAnswersetId' in params.data && params.data.latestAnswersetId) {
      out = `<div style="
        display: table;
        width: 100%;
        position: absolute;
        height: 100%;">
          <div style="
            display: table-cell;
            vertical-align: middle;
          ">
            <img src=../${NetworkImg} height="25" width="25" />
          </div>
        </div>`;
    }
    return out;
  }
  cellRendererTaskStatus(params) {
    let out = '';
    if (params.data.isBusy) {
      out = `<div style="
        display: table;
        width: 100%;
        position: absolute;
        height: 100%;">
          <div style="
            display: table-cell;
            vertical-align: middle;
          ">
            <img src=../${LoadingImg} height="25" width="25" />
          </div>
        </div>`;
    } else {
      out = `<div style="
        display: table;
        width: 100%;
        position: absolute;
        height: 100%;">
          <div style="
            display: table-cell;
            vertical-align: middle;
          ">
            <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="1em" width="1em" viewBox="0 0 40 40" style="vertical-align: middle;"><g><path d="m31 7.5h-27.5v10h27.5l5-5-5-5z m-10 7.5h-5v-5h5v5z m0-15h-5v5h5v-5z m-5 40h5v-20h-5v20z"></path></g></svg>
          </div>
        </div>`;
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

  cellRendererTimestamp(params) {
    let out = '';
    if (params.data.timestamp) {
      out = timestampToDate(params.data.timestamp).toLocaleDateString();
    }
    return out;
  }

  render() {
    // { headerName: '', field: 'isBusy', suppressMenu: true, cellRenderer: this.cellRendererBusy, width: 10 },
    // {
    //   headerName: '',
    //   field: 'latest_answerset_id',
    //   suppressMenu: true,
    //   cellRenderer: this.cellRendererAnswers,
    //   width: 10,
    //   onCellClicked: params => console.log('Clicked'),
    // },
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
          <Panel.Body style={{ padding: '0px' }}>
            <div className="ag-theme-material" style={{ width: '100%', height: this.props.height }}>
              <AgGridReact
                columnDefs={[
                  {
                    headerName: '*',
                    field: 'isUserOwned',
                    headerClass: 'no-padding',
                    cellClass: 'no-padding',
                    suppressMenu: true,
                    // suppressSorting: true,
                    cellRenderer: this.cellRendererOwned,
                    width: 70,
                    minWidth: 20,
                    hide: true,
                    tooltip: value => (value ? 'This is your question' : ''),
                    suppressResize: true,
                  },
                  {
                    headerName: 'Question',
                    field: 'naturalQuestion',
                    suppressMenu: true,
                    suppressSorting: true,
                    width: 500,
                  },
                  {
                    headerName: 'Task Status',
                    headerClass: 'no-padding',
                    field: 'isBusy',
                    suppressMenu: true,
                    suppressSorting: true,
                    cellRenderer: this.cellRendererTaskStatus,
                    width: 70,
                    minWidth: 20,
                    cellClass: 'no-padding',
                  },
                  {
                    headerName: 'Answerset',
                    headerClass: 'no-padding',
                    field: 'latestAnswersetId',
                    suppressMenu: true,
                    suppressSorting: true,
                    cellRenderer: this.cellRendererAnswers,
                    width: 70,
                    minWidth: 20,
                    cellClass: 'no-padding',
                  },
                  {
                    headerName: 'Timestamp',
                    headerClass: 'no-padding',
                    field: 'timestamp',
                    suppressMenu: true,
                    cellRenderer: this.cellRendererTimestamp,
                    width: 70,
                    minWidth: 20,
                    cellClass: 'no-padding',
                    sortingOrder: ['desc', 'asc', 'null'],
                  },
                ]}
                rowData={this.props.questions}
                getRowClass={this.getRowClass}
                enableFiltering
                enableSorting

                quickFilterText={this.state.quickFilterText}
                suppressMovableColumns
                suppressCellSelection
                defaultColDef={{ width: 100, headerComponentParams: { template: '' } }}
                rowSelection="single"
                onCellClicked={this.onClick}
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
};

QuestionListTableAgGrid.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  questions: PropTypes.arrayOf(PropTypes.shape({ natural_question: PropTypes.string })).isRequired,
  showSearch: PropTypes.bool.isRequired,
  callbackQuestionSelect: PropTypes.func.isRequired,
  callbackAnswersetSelect: PropTypes.func.isRequired,
};

export default QuestionListTableAgGrid;
