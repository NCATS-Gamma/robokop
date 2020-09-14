import React, { useState } from 'react';
import shortid from 'shortid';
import _ from 'lodash';
import {
  FaFilter, FaCheck,
} from 'react-icons/fa';
import Popper from '@material-ui/core/Popper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import entityNameDisplay from '../../../../utils/entityNameDisplay';

export default function AnswersetFilter(props) {
  // Store comes from props in Table component
  const { qnodeId, messageStore } = props;
  const [search, updateSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [expanded, setExpanded] = useState({});

  function handleSearch(value) {
    messageStore.searchFilter(qnodeId, value);
    updateSearch(value);
  }

  function check(propertyKey, propertyValue) {
    messageStore.updateFilterKeys(qnodeId, propertyKey, propertyValue);
  }

  function checkAll(propertyKey) {
    messageStore.checkAll(qnodeId, propertyKey);
  }

  function reset() {
    messageStore.reset(qnodeId);
    // updateSearch('');
  }

  const handleExpand = (panel) => (event, isExpanded) => {
    expanded[panel] = isExpanded;
    setExpanded(_.cloneDeep(expanded));
  };

  return (
    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
      <div className="filterHeaderPopper">
        {Object.keys(messageStore.filterKeys[qnodeId]).length > 0 && (
          <>
            <Button
              style={{
                display: 'flex', justifyContent: 'center', width: '100%', cursor: 'pointer',
              }}
              onClick={(e) => setAnchorEl(anchorEl ? null : e.target)}
              variant="contained"
            >
              <FaFilter />
              {messageStore.isFiltered(qnodeId) && <FaCheck />}
            </Button>
            <Popper id={shortid.generate()} className="answersetFilter MuiPaper-elevation10" open={Boolean(anchorEl)} anchorEl={anchorEl}>
              <TextField
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search"
                style={{ width: '100%', padding: '5px' }}
                variant="outlined"
              />
              <Button style={{ display: 'block', margin: '10px auto' }} onClick={reset}>Reset</Button>
              {Object.keys(messageStore.searchedFilter[qnodeId] || {}).map((propertyKey) => {
                // if there aren't any values under the header, don't show anything
                if (Object.keys(messageStore.searchedFilter[qnodeId][propertyKey]).length) {
                  return (
                    <div key={shortid.generate()}>
                      <Accordion expanded={expanded[propertyKey]} onChange={handleExpand(propertyKey)}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                        >
                          <FormControlLabel
                            className="pull-right"
                            control={(
                              <Checkbox
                                defaultChecked={!messageStore.isPropFiltered(messageStore.filterKeys[qnodeId][propertyKey])}
                                onChange={() => checkAll(propertyKey)}
                                style={{ marginRight: '10px' }}
                                color="primary"
                              />
                            )}
                            label="Toggle All"
                          />
                          <span style={{ marginLeft: 10, fontWeight: 'bold' }}>{entityNameDisplay(propertyKey)}</span>
                        </AccordionSummary>
                        <AccordionDetails style={{ flexDirection: 'column' }}>
                          {Object.keys(messageStore.searchedFilter[qnodeId][propertyKey]).map((propertyValue) => {
                            const style = { fontWeight: 'normal', whiteSpace: 'nowrap' };
                            if (!messageStore.filterKeys[qnodeId][propertyKey][propertyValue][1]) {
                              style.color = 'lightgrey';
                            }
                            return (
                              <div key={shortid.generate()} style={{ paddingLeft: '20px', display: 'flex' }}>
                                <FormControlLabel
                                  className="filterCheckboxLabel"
                                  style={style}
                                  control={(
                                    <Checkbox
                                      defaultChecked={messageStore.filterKeys[qnodeId][propertyKey][propertyValue][0]}
                                      onChange={() => check(propertyKey, propertyValue)}
                                      style={{ marginRight: '10px' }}
                                      color="primary"
                                    />
                                  )}
                                  label={propertyValue}
                                />
                              </div>
                            );
                          })}
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  );
                }
                return null;
              })}
            </Popper>
          </>
        )}
      </div>
    </ClickAwayListener>
  );
}
