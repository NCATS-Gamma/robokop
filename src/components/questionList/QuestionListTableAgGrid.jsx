import React from 'react';
import PropTypes from 'prop-types';

import { FormControl } from 'react-bootstrap';
import { AgGridReact, AgGridColumn } from 'ag-grid-react';

class QuestionListTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      quickFilterText: '',
    };

    this.onClick = this.onClick.bind(this);
    this.onGridReady = this.onGridReady.bind(this);
    this.onFilterTextChange = this.onFilterTextChange.bind(this);
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
      const question = selectedRow[0];
      this.props.callbackRowClick(question);
    }
  }
  onFilterTextChange(event) {
    this.setState({ quickFilterText: event.target.value });
  }
  render() {
    return (
      <div>
        {this.props.showSearch &&
        <FormControl
          id="filterText"
          type="text"
          placeholder="Search"
          onChange={this.onFilterTextChange}
        />
        }
        <div className="ag-theme-bootstrap" style={{ width: '100%', height: '200px' }}>
          <AgGridReact
            columnDefs={[
              { headerName: 'Name', field: 'name', suppressMenu: true },
              { headerName: 'Question', field: 'natural_question', suppressMenu: true },
              { headerName: 'Notes', field: 'notes', suppressMenu: true },
            ]}
            rowData={this.props.questions}
            enableFiltering
            enableSorting

            quickFilterText={this.state.quickFilterText}
            suppressMovableColumns
            defaultColDef={{ width: 100, headerComponentParams: { template: '' } }}
            rowSelection="single"
            onSelectionChanged={this.onClick}
            onGridReady={this.onGridReady}
          >
            <AgGridColumn field="name" />
            <AgGridColumn field="natural_question" />
            <AgGridColumn field="notes" />
          </AgGridReact>
        </div>
      </div>
    );
  }
}


QuestionListTable.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  showSearch: PropTypes.bool.isRequired,
  callbackRowClick: PropTypes.func.isRequired,
};

export default QuestionListTable;
