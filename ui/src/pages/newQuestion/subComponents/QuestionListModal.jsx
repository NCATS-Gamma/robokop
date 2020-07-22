import React from 'react';
import { Modal } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';

class QuestionListModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.onGridReady = this.onGridReady.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    this.gridApi.sizeColumnsToFit();
  }

  onClick(event) {
    this.props.questionSelected(event.data.id);
  }

  render() {
    const { show, close, questions } = this.props;
    return (
      <Modal
        show={show}
        onHide={close}
      >
        <Modal.Header closeButton>
          <Modal.Title>Questions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="ag-theme-material questionListModal" style={{ width: '100%', height: 400 }}>
            <AgGridReact
              columnDefs={[
                {
                  headerName: 'Questions',
                  field: 'naturalQuestion',
                  suppressMenu: true,
                  suppressSorting: true,
                  width: 500,
                },
              ]}
              rowData={questions}

              suppressMovableColumns
              suppressCellSelection
              defaultColDef={{ width: 100, headerComponentParams: { template: '' } }}
              rowSelection="single"
              onRowClicked={this.onClick}
              onGridReady={this.onGridReady}
            />
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

export default QuestionListModal;
