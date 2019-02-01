import React from 'react';
import PropTypes from 'prop-types';

import { Panel, FormControl } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';

import LoadingImg from '../../../assets/images/loading.gif';
import NetworkImg from '../../../assets/images/network.png';

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
    this.cellRendererBusy = this.cellRendererBusy.bind(this);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.gridApi.sizeColumnsToFit();

    const sort = [
      { colId: 'isUserOwned', sort: 'desc' },
      // { colId: 'latest_answerset_timestamp', sort: 'desc' },
    ];
    this.gridApi.setSortModel(sort);
  }
  onClick(event) {
    if (event.column.colId === 'latestAnswersetId') {
      this.props.callbackAnswersetSelect(event.node.data, { id: event.node.data.latestAnswersetId });
    } else {
      this.props.callbackQuestionSelect(event.node.data);
    }
    // this.props.callbackQuestionSelect(event.node.data);
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
  cellRendererBusy(params) {
    let out = '';
    if (params.value) {
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
      // out = 'Updating...';
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
                    suppressMenu: true,
                    cellRenderer: this.cellRendererOwned,
                    width: 5,
                    hide: true,
                    tooltip: value => (value ? 'This is your question' : ''),
                    suppressResize: true,
                  },
                  {
                    headerName: 'Question',
                    field: 'naturalQuestion',
                    suppressMenu: true,
                    width: 500,
                  },
                  // {
                  //   headerName: 'User',
                  //   field: 'user_email',
                  //   suppressMenu: true,
                  //   width: 100,
                  // },
                  // {
                  //   headerName: 'Notes',
                  //   field: 'notes',
                  //   suppressMenu: true,
                  //   width: 200,
                  // },
                  {
                    headerName: '',
                    field: 'isBusy',
                    suppressMenu: true,
                    cellRenderer: this.cellRendererBusy,
                    width: 20,
                    minWidth: 20,
                    hide: false,
                    cellClass: 'no-padding',
                  },
                  {
                    headerName: '',
                    field: 'latestAnswersetId',
                    suppressMenu: true,
                    cellRenderer: this.cellRendererAnswers,
                    width: 20,
                    minWidth: 20,
                    hide: false,
                    cellClass: 'no-padding',
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
