import React, { useState } from 'react';
import Popper from '@material-ui/core/Popper';
import IconButton from '@material-ui/core/IconButton';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { FaEllipsisH } from 'react-icons/fa';
import shortid from 'shortid';

export default function Cell(props) {
  const { row } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  // if the value is an array, show each one on a new line, otherwise, just display the single value
  if (Array.isArray(row.value) && row.value.length > 1) {
    return (
      <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
        <div style={{ width: '100%' }}>
          <IconButton
            onClick={(e) => setAnchorEl(anchorEl ? null : e.target)}
          >
            <FaEllipsisH size={25} />
          </IconButton>
          <Popper open={Boolean(anchorEl)} anchorEl={anchorEl}>
            <div className="popperContainer">
              {row.value.map((value) => <p key={shortid.generate()}>{value}</p>)}
            </div>
          </Popper>
        </div>
      </ClickAwayListener>
    );
  }
  if (Array.isArray(row.value) && row.value.length === 0) {
    return <div>None</div>;
  }
  return <div>{row.value}</div>;
}
