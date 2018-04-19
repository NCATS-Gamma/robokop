import React from 'react';
import PropTypes from 'prop-types';

import { FormControl } from 'react-bootstrap';
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
        <div>
          <FormControl
            id="filterText"
            type="text"
            placeholder="Search"
            onChange={this.onFilterTextChange}
          />
          <br />
        </div>
        }
        <div className="ag-theme-material" style={{ width: '100%', height: this.props.height }}>
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

QuestionListTableAgGrid.defaultProps = {
  height: '100px',
};

QuestionListTableAgGrid.propTypes = {
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  questions: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
  showSearch: PropTypes.bool.isRequired,
  callbackRowClick: PropTypes.func.isRequired,
};

export default QuestionListTableAgGrid;
