'use babel';

import React from 'react';
import { AgGridReact, AgGridColumn } from 'ag-grid-react';

class ProtocopBoardsTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filterText: '',
    };

    this.onClick = this.onClick.bind(this);
    this.onGridReady = this.onGridReady.bind(this);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.gridApi.sizeColumnsToFit();
  }
  onClick() {
    const selectedRow = this.gridApi.getSelectedRows();
    
    if (Array.isArray(selectedRow) && selectedRow.length > 0) {
      const board = selectedRow[0];
      this.props.callbackRowClick(board);
    }
  }

  render() {
    return (
      <div>
        {/* <div className="row">
          <div className="col-md-4">
            {'Filter:'}
          </div>
          <div className="col-md-8">
            {'Future Input Control'}
          </div>
        </div> */}
        {/* <div className="row">
          <div className="col-md-12"> */}
            <div className="ag-theme-bootstrap">
              <AgGridReact
                columnDefs={[{ headerName: 'Blackboard Name', field: 'name', suppressMenu: true }]}
                rowData={this.props.boards}
                enableFiltering
                suppressMovableColumns
                defaultColDef={{ width: 100, headerComponentParams: { template: '' }}}
                rowSelection="single"
                onSelectionChanged={this.onClick}
                onGridReady={this.onGridReady}
              >
                <AgGridColumn field="name" />
              </AgGridReact>
            </div>
          </div>
      //   </div>
      // </div>
    );
  }
}

export default ProtocopBoardsTable;
