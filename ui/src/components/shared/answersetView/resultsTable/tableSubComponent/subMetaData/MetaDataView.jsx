import React, {
  useState, useEffect, useCallback,
} from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { FaClone } from 'react-icons/fa';

import './metadata.css';

import SubTable from './SubTable';
import Cell from './Cell';
import getNodeTypeColorMap from '../../../../../../utils/colorUtils';
import entityNameDisplay from '../../../../../../utils/entityNameDisplay';
import getColumnWidth from '../../../../../../utils/rtColumnWidth';

import config from '../../../../../../config.json';

export default function MetaDataView(props) {
  const { rowData } = props;
  const [selectedNodeId, changeNodeId] = useState(Object.keys(rowData)[0]);
  const [dropdownNodes, setDropdownNodes] = useState([]);
  const [columns, setColumns] = useState([]);
  const [metaData, setMetaData] = useState([]);
  const colorMap = useCallback(getNodeTypeColorMap(config.concepts), [config.concepts]);

  function makeColumns() {
    const blocklist = ['isSet', 'level'];
    const allowlist = ['name', 'id', 'type'];
    const { isSet } = rowData[selectedNodeId];
    const nodes = isSet ? rowData[selectedNodeId].setNodes : [rowData[selectedNodeId]];
    const columnHeaders = [];
    let keys;
    if (nodes.length > 1) {
      // if the nodes passed in are a set
      let setKeys = new Set();
      // map over every key in all the set objects and make a list of all unique keys
      nodes.forEach((node) => Object.keys(node).map((key) => setKeys.add(key)));
      setKeys = [...setKeys].filter((key) => !blocklist.includes(key));
      let firstKeys = setKeys.filter((key) => allowlist.includes(key));
      firstKeys = firstKeys.sort();
      keys = firstKeys.concat(setKeys.filter((key) => !allowlist.includes(key)));
    } else {
      // if the nodes are just a single node
      const node = Object.keys(nodes[0]).filter((key) => !blocklist.includes(key));
      let firstKeys = node.filter((key) => allowlist.includes(key));
      firstKeys = firstKeys.sort();
      keys = firstKeys.concat(node.filter((key) => !allowlist.includes(key)));
      node.forEach((key) => {
        // true or false aren't showing up in react table, just making them more readable
        if (typeof nodes[0][key] === 'boolean') {
          nodes[0][key] = nodes[0][key] ? 'Yes' : 'No';
        }
      });
    }
    keys.forEach((key, i) => {
      // loop over all the keys and make the columns and headers
      const columnHeaderObj = {
        Header: key,
        id: i,
        accessor: key,
        width: getColumnWidth(nodes, key, key),
        Cell: (row) => <Cell row={row} />,
      };
      columnHeaders.push(columnHeaderObj);
    });

    const headerTitle = (
      isSet ? `Nodes for the ${selectedNodeId} - ${entityNameDisplay(rowData[selectedNodeId].type)} Set` :
        `Metadata for ${selectedNodeId} - ${entityNameDisplay(rowData[selectedNodeId].type)}`
    );
    const backgroundColor = colorMap(rowData[selectedNodeId].type);
    const cols = [
      {
        Header: <div style={{ backgroundColor, padding: 2 }}>{headerTitle}</div>,
        id: 'metadataHeader',
        columns: columnHeaders,
      },
    ];
    setColumns(cols);
    setMetaData(nodes);
  }

  useEffect(() => {
    const nodeList = Object.keys(rowData);

    const dropDownList = nodeList.map((nId) => ({
      nId,
      isSet: rowData[nId].isSet,
      type: entityNameDisplay(rowData[nId].type),
    }));

    setDropdownNodes(dropDownList);
  }, []);

  useEffect(() => {
    makeColumns();
  }, [selectedNodeId]);

  // Filter method for table columns that is case-insensitive, and matches all rows that contain
  // provided sub-string
  function defaultFilterMethod(filter, row, column) { // eslint-disable-line no-unused-vars
    // console.log('filter, row, column', filter, row, column);
    const id = filter.pivotId || filter.id;
    return row[id] !== undefined ? String(row[id].toLowerCase()).includes(filter.value.toLowerCase()) : true;
  }

  return (
    <div style={{ padding: '10px 20px 0px 125px' }}>
      {columns.length > 0 && metaData.length > 0 && (
        <>
          <div style={{ width: '300px', marginBottom: '5px' }}>
            <FormControl className="metaDataNodeSelector">
              <InputLabel id="metadata-node-selector">Select A Node</InputLabel>
              <Select
                labelId="metadata-node-selector"
                value={selectedNodeId}
                onChange={(e) => changeNodeId(e.target.value)}
              >
                {dropdownNodes.map((n) => (
                  <MenuItem key={n.nId} value={n.nId}>
                    {`${n.nId}: ${n.type}`}
                    {n.isSet && <FaClone />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <SubTable
            data={metaData}
            columns={columns}
          />
        </>
      )}
    </div>
  );
}
