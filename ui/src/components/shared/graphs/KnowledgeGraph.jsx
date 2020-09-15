import React, { useState, useEffect, useRef } from 'react';
import Paper from '@material-ui/core/Paper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Popper from '@material-ui/core/Popper';
import Button from '@material-ui/core/Button';
import Slider from '@material-ui/core/Slider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import { FaAngleDown } from 'react-icons/fa';

// import './kg.css';
import SubGraphViewer from './SubGraphViewer';
import Loading from '../../loading/Loading';

function SliderLabel(props) {
  const { children, open, value } = props;
  return (
    <Tooltip
      className="sliderTooltip"
      open={open}
      enterTouchDelay={0}
      placement="top"
      title={`${value} Nodes`}
    >
      {children}
    </Tooltip>
  );
}

export default function KnowledgeGraph(props) {
  const { messageStore, concepts } = props;
  const [hierarchical, toggleHierarchy] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [localPruneNum, updateLocalPruneNum] = useState(35);
  const [committedPruneNum, setCommittedPruneNum] = useState(Math.min(35, messageStore.numKgNodes));
  const [kg, setKg] = useState({ nodes: [], edges: [] });
  const [loading, toggleLoading] = useState(true);
  const randomSeed = useRef(Math.floor(Math.random() * 100));
  const graphClickCallback = useRef(() => {});

  useEffect(() => {
    setKg(messageStore.annotatedPrunedKnowledgeGraph(committedPruneNum));
    toggleLoading(false);
  }, [committedPruneNum, hierarchical]);

  return (
    <Paper>
      <div
        style={{
          position: 'relative', minHeight: '200px', display: 'table', width: '100%',
        }}
      >
        {!loading ? (
          <>
            <SubGraphViewer
              subgraph={kg}
              concepts={concepts}
              layoutRandomSeed={randomSeed.current}
              layoutStyle={hierarchical ? 'hierarchical' : ''}
              showSupport={false}
              omitEdgeLabel
              callbackOnGraphClick={graphClickCallback.current}
            />
            <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
              <div className="graphPopover">
                <Button
                  style={{
                    width: '100%', textAlign: 'center', cursor: 'pointer', padding: '10px',
                  }}
                  onClick={(e) => setAnchorEl(anchorEl ? null : e.target)}
                  variant="contained"
                >
                  Graph Options
                  <FaAngleDown />
                </Button>
                <Popper
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                >
                  <div className="popoverDiv">
                    {messageStore.numKgNodes !== committedPruneNum ? (
                      `Pruned graph showing top ${committedPruneNum} nodes`
                    ) : (
                      'Prune Graph'
                    )}
                    <Slider
                      value={localPruneNum}
                      onChange={(e, v) => updateLocalPruneNum(v)}
                      onChangeCommitted={(e, v) => setCommittedPruneNum(v)}
                      min={messageStore.numQgNodes}
                      max={messageStore.numKgNodes}
                      ValueLabelComponent={SliderLabel}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox checked={hierarchical} onChange={(e) => toggleHierarchy(e.target.checked)} />
                      }
                      label="Hierarchical"
                    />
                  </div>
                </Popper>
              </div>
            </ClickAwayListener>
          </>
        ) : (
          <Loading />
        )}
      </div>
    </Paper>
  );
}
