import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import ReactTable from 'react-table-6';
import { FaClone, FaEllipsisH } from 'react-icons/fa';
import shortid from 'shortid';
import {
  OverlayTrigger, Popover,
} from 'react-bootstrap';

import entityNameDisplay from '../../../../../utils/entityNameDisplay';
import getColumnWidth from '../../../../../utils/rtColumnWidth';
import getNodeTypeColorMap from '../../../../../utils/colorUtils';

export default function MetaDataView(props) {
  const {
    concepts, answersTableStore,
  } = props;
  const { rowData, nodeId, setNodeId } = answersTableStore;
  if (!Object.keys(rowData).length) { // if user clicks on gene in table to show metadata, we need to sync props with state before continuing
    return null;
  }
  const colorMap = getNodeTypeColorMap(concepts);
  // Filter method for table columns that is case-insensitive, and matches all rows that contain
  // provided sub-string
  const defaultFilterMethod = (filter, row, column) => { // eslint-disable-line no-unused-vars
    // console.log('filter, row, column', filter, row, column);
    const id = filter.pivotId || filter.id;
    return row[id] !== undefined ? String(row[id].toLowerCase()).includes(filter.value.toLowerCase()) : true;
  };

  const nodeList = Object.keys(rowData.nodes);

  const useNodeId = nodeId || nodeList[0];

  // const dropDownData = nodeList.map((nId) => ({
  //   nodeId: nId,
  //   isSet: rowData.nodes[nId].isSet,
  //   type: entityNameDisplay(rowData.nodes[nId].type),
  // }));
  // const ListItem = ({ item }) => (
  //   <span>
  //     <strong>{`${item.nodeId}: `}</strong>
  //     {`${item.type} `}
  //     <span className="">
  //       {item.isSet && <FaClone />}
  //     </span>
  //   </span>
  // );
  const getColumnSpecs = (nodes) => {
    const blocklist = ['isSet'];
    const allowlist = ['name', 'id', 'type'];
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
    keys.forEach((key) => {
      // loop over all the keys and make the columns and headers
      const columnHeaderObj = {};
      columnHeaderObj.Header = key;
      columnHeaderObj.accessor = key;
      columnHeaderObj.width = getColumnWidth(nodes, columnHeaderObj.accessor, columnHeaderObj.Header);
      columnHeaderObj.Cell = (row) => {
        // if the value is an array, show each one on a new line, otherwise, just display the single value
        if (Array.isArray(row.value) && row.value.length > 1) {
          // TODO: turning off filter doesn't seem to be working, but this is what needs to happen.
          columnHeaderObj.filterable = false;
          const arrayPopover = (
            <Popover id={shortid.generate()}>
              {row.value.map((value) => <p key={shortid.generate()}>{value}</p>)}
            </Popover>
          );
          return (
            <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={arrayPopover} style={{ cursor: 'pointer' }}>
              <div style={{ width: '100%', textAlign: 'center' }}><FaEllipsisH size={25} /></div>
            </OverlayTrigger>
          );
        }
        return <div>{row.value}</div>;
      };
      columnHeaders.push(columnHeaderObj);
    });
    return columnHeaders;
  };
  const { isSet } = rowData.nodes[useNodeId];
  const metadata = isSet ? rowData.nodes[useNodeId].setNodes : [rowData.nodes[useNodeId]];
  const headerTitle = (
    isSet ? `Nodes for the ${useNodeId} - ${entityNameDisplay(rowData.nodes[useNodeId].type)} Set` :
      `Metadata for ${useNodeId} - ${entityNameDisplay(rowData.nodes[useNodeId].type)}`
  );
  const backgroundColor = colorMap(rowData.nodes[useNodeId].type);

  return (
    <div style={{ padding: '10px 20px 0px 125px' }}>
      <div style={{ width: '300px', marginBottom: '5px' }}>
        <FormControl>
          <InputLabel id="node-select">Node</InputLabel>
          <Select
            labelId="node-select"
            id="node-select"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
          >
            {nodeList.map((nId) => (
              <MenuItem value={nId} key={nId}>
                <b>{nId}: </b>
                {entityNameDisplay(rowData.nodes[nId].type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <ReactTable
        data={metadata}
        columns={[{
          Header: <div style={{ backgroundColor, padding: 2 }}>{headerTitle}</div>,
          columns: getColumnSpecs(metadata),
        }]}
        defaultPageSize={5}
        defaultFilterMethod={defaultFilterMethod}
        pageSizeOptions={[5, 10, 15, 20]}
        minRows={1}
        filterable={metadata.length > 5}
        showPagination={metadata.length > 5}
        className="-highlight"
      />
    </div>
  );
}
