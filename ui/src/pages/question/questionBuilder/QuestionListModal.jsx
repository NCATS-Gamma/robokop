import React, { useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';

export default function QuestionListModal(props) {
  const {
    questionSelected, show, close, questions,
  } = props;
  const gridApi = useRef(null);
  const columnApi = useRef(null);
  function onGridReady(params) {
    gridApi.current = params.api;
    columnApi.current = params.columnApi;

    gridApi.current.sizeColumnsToFit();
  }

  function onClick(event) {
    questionSelected(event.data.id);
  }

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
                sortable: false,
                width: 500,
              },
            ]}
            rowData={questions}

            suppressMovableColumns
            suppressCellSelection
            defaultColDef={{ width: 100, headerComponentParams: { template: '' } }}
            rowSelection="single"
            onRowClicked={onClick}
            onGridReady={onGridReady}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
}
