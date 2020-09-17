import React from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import './emptyTable.css';

function makeEmptyArray(num) {
  const emptyArray = [];
  for (let i = 0; i < num; i += 1) {
    emptyArray.push('');
  }
  return emptyArray;
}

export default function EmptyTable({ numRows, numCells }) {
  const emptyRows = makeEmptyArray(numRows);
  const emptyCells = makeEmptyArray(numCells);
  return (
    <>
      {emptyRows.map((row, i) => (
        <TableRow key={`empty-row-${i}`}>
          {emptyCells.map((cell, j) => (
            <TableCell key={`empty-cell-${j}`} className="emptyCell"> </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
