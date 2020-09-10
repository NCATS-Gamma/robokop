/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import {
  useTable, usePagination, useExpanded, useSortBy, useFilters,
} from 'react-table';
import MuiTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';

import SubComponent, { answersetSubComponentEnum } from './tableSubComponent/TableSubComponent';
import EmptyTable from './EmptyTable';
import AnswersetFilter from './AnswersetFilter';

export default function Table(props) {
  const {
    columns, data, messageStore,
  } = props;
  const [activeSubComponentButton, setActiveSubComponentButton] = useState(answersetSubComponentEnum.json);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    visibleColumns,
    state,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        sortBy: [
          {
            id: 'score',
            desc: true,
          },
        ],
      },
    },
    useFilters,
    useSortBy,
    useExpanded,
    usePagination,
  );

  return (
    <>
      <MuiTable {...getTableProps()} size="small">
        <TableHead>
          {headerGroups.map((headerGroup, i) => (
            <React.Fragment key={`header-group-${i}`}>
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <TableCell
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    style={{ width: column.width, padding: 0 }}
                  >
                    <div
                      className={column.isSorted ? column.isSortedDesc ? 'underline' : 'upperline' : '' }
                      style={{ textAlign: 'center' }}
                    >
                      {column.render('Header')}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
              {/* Filter row */}
              <TableRow>
                {headerGroup.headers.map((column, ind) => (
                  <TableCell key={`filter-header-${ind}`}>
                    {column.filterable ? (
                      <AnswersetFilter
                        messageStore={messageStore}
                        qnodeId={column.qnodeId}
                      />
                    ) : (
                      null
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </React.Fragment>
          ))}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {page.length ? page.map((row, i) => {
            prepareRow(row);
            return (
              <React.Fragment key={`results-table-row-${i}`}>
                <TableRow {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <TableCell {...cell.getCellProps()}>
                      {cell.render('Cell')}
                    </TableCell>
                  ))}
                </TableRow>
                {row.isExpanded ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="expandedRow">
                      <SubComponent
                        data={row.original}
                        messageStore={messageStore}
                        activeButton={activeSubComponentButton}
                        setActiveButton={setActiveSubComponentButton}
                      />
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          }) : (
            <EmptyTable
              numRows={10}
              numCells={visibleColumns.length}
            />
          )}
        </TableBody>
      </MuiTable>
      {!page.length > 0 && (
        <div id="emptyTableOverlay">No Results</div>
      )}
      <div className="pagination">
        <Button
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
          variant="contained"
        >
          Previous
        </Button>
        <div>
          {'Page '}
          <input
            type="number"
            value={state.pageIndex + 1}
            min={1}
            max={pageCount}
            onChange={(e) => {
              const pageInd = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(pageInd);
            }}
            style={{ width: '100px' }}
          />
          {` of ${pageCount}`}
        </div>
        <select
          value={state.pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pSize) => (
            <option key={pSize} value={pSize}>
              {`Show ${pSize}`}
            </option>
          ))}
        </select>
        <Button
          onClick={() => nextPage()}
          disabled={!canNextPage}
          variant="contained"
        >
          Next
        </Button>
      </div>
    </>
  );
}
