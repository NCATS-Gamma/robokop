import React from 'react';
import PropTypes from 'prop-types';

import { AgGridReact, AgGridColumn } from 'ag-grid-react';

class AnswersetTableAgGrid extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onGridReady = this.onGridReady.bind(this);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.gridApi.sizeColumnsToFit();

    const sort = [
      {
        colId: 'name',
        sort: 'asc',
      },
    ];
    this.gridApi.setSortModel(sort);
  }
  onClick() {
    const selectedRow = this.gridApi.getSelectedRows();

    if (Array.isArray(selectedRow) && selectedRow.length > 0) {
      const answerset = selectedRow[0];
      this.props.callbackRowClick(answerset);
    }
  }
  render() {
    return (
      <div>
        <div className="ag-theme-bootstrap" style={{ width: '100%', height: this.props.height }}>
          <AgGridReact
            columnDefs={[
              {
                headerName: 'Available Answer Sets',
                field: 'timestamp',
                suppressMenu: true,
                valueGetter: params => new Date(params.data.timestamp).toLocaleString(),
              },
            ]}
            rowData={this.props.answersets}
            enableSorting

            suppressMovableColumns
            defaultColDef={{ width: 100, headerComponentParams: { template: '' } }}
            rowSelection="single"
            onSelectionChanged={this.onClick}
            onGridReady={this.onGridReady}
          >
            <AgGridColumn field="timestamp" />
          </AgGridReact>
        </div>
      </div>
    );
  }
}

AnswersetTableAgGrid.defaultProps = {
  height: '100px',
};

AnswersetTableAgGrid.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  answersets: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  callbackRowClick: PropTypes.func.isRequired,
};

export default AnswersetTableAgGrid;
