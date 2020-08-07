import React, { useState, useEffect, useRef } from 'react';
import { Row, Col } from 'react-bootstrap';
import ReactTable from 'react-table-6';
import _ from 'lodash';

import 'react-table-6/react-table.css';

// import { DropdownList } from 'react-widgets';

// import AnswersetFilter from './AnswersetFilter';
import DownloadButton from '../../DownloadButton';
import AnswersetTableSubComponent from './AnswersTableSubComponent';
import entityNameDisplay from '../../../../utils/entityNameDisplay';
import getNodeTypeColorMap from '../../../../utils/colorUtils';
import getColumnWidth from '../../../../utils/rtColumnWidth';

import useAnswersetTable from './useAnswersTable';

export default function AnswersTable(props) {
  const { messageStore, concepts, simpleExpand } = props;
  let { fileName } = props;
  const [expanded, setExpanded] = useState({});
  const reactTable = useRef('');
  const answersTableStore = useAnswersetTable();

  function isSelected(rowInfo) {
    return Boolean(expanded[rowInfo.viewIndex]);
  }

  // Filter method for table columns that is case-insensitive, and matches all rows that contain
  // provided sub-string
  function defaultFilterMethod(filter, row, column) { // eslint-disable-line no-unused-vars
    // console.log('filter, row, column', filter, row, column);
    // store default filter returns a boolean
    return messageStore.defaultFilter(row);
  }

  function getReactTableColumnSpec(columnHeaders, data) {
    const bgColorMap = getNodeTypeColorMap(concepts);
    // Take columnHeaders from store and update it as needed
    const colHeaders = columnHeaders.map((col) => {
      const colSpecObj = _.cloneDeep(col);
      const nodeId = colSpecObj.id;
      if (colSpecObj.isSet) {
        colSpecObj.accessor = (d) => (d[nodeId][0].name ? d[nodeId][0].name : d[nodeId][0].id);
        colSpecObj.style = { cursor: 'pointer', userSelect: 'none' };
        // cellTextFn returns array of strings to be used for display
        // in custom Cell renderer. This modularity is so that it can
        // be re-used in the getColumnWidth() method
        const cellTextFn = (setNodes) => {
          if (!setNodes) {
            return [];
          }
          if (setNodes.length === 1) {
            return setNodes[0].name ? [setNodes[0].name] : [setNodes[0].id];
          }
          return [entityNameDisplay(colSpecObj.type), `[${setNodes.length}]`];
        };
        colSpecObj.Cell = (row) => {
          const setNodes = messageStore.getSetNodes(row.index, row.column.id);
          const cellText = cellTextFn(setNodes);
          return (
            <span>
              <span style={{ textAlign: 'center' }}>
                {`${cellText[0]} `}
                {(cellText.length > 1) && (
                  <span style={{ fontWeight: 'bold' }}>{cellText[1]}</span>
                )}
              </span>
              <span className="pull-right">&#x2295;</span>
            </span>
          );
        };
        colSpecObj.width = getColumnWidth(
          data, colSpecObj.accessor, colSpecObj.Header,
          (setNodes) => `${cellTextFn(setNodes).join(' ')}   `,
        );
      } else {
        colSpecObj.accessor = (d) => (d[nodeId][0].name ? d[nodeId][0].name : d[nodeId][0].id);
        colSpecObj.width = getColumnWidth(data, colSpecObj.accessor, colSpecObj.Header);
      }
      // this initializes the filter object for all nodes
      messageStore.initializeFilter();
      // colSpecObj.Filter = props =>
      //   (<AnswersetFilter
      //     {...props}
      //     qnodeId={nodeId}
      //     messageStore={messageStore}
      //   />);
      const backgroundColor = bgColorMap(colSpecObj.type);
      const columnHeader = colSpecObj.Header;
      colSpecObj.Header = () => (
        <div style={{ backgroundColor }}>{columnHeader}</div>
      );
      return colSpecObj;
    });
    // Add Score column at the end
    colHeaders.push({
      Header: 'Rank',
      id: 'score',
      // width: 75,
      filterable: false,
      accessor: 'score',
      Cell: (d) => <span className="number">{parseFloat(Math.round(d.value * 1000) / 1000).toFixed(3)}</span>,
      className: 'center',
    });
    return colHeaders;
  }

  function initializeState(columnHeaders, newAnswers) {
    const newColumns = getReactTableColumnSpec(columnHeaders, newAnswers);
    answersTableStore.setAnswers(newAnswers);
    answersTableStore.setColumns(newColumns);
  }

  useEffect(() => {
    const answerTables = messageStore.answerSetTableData();
    const { columnHeaders, answers: newAnswers } = answerTables;
    initializeState(columnHeaders, newAnswers);
    if (messageStore.unknownNodes) {
      window.alert('We were able to retrieve the answers to this question. However, it seems there was an error retrieving some of the nodes. If you would like complete answers, please try asking this question again.');
    }
  }, []);

  /**
   * Method to update table subcomponent and toggle expanded state of table appropriately
   * This method works around react-table limitations to enable multiple sub-components on
   * a per-column basis
   * @param {Int} rowIndex Index of the row clicked by the user
   * @param {JSX} newSubComponent
   */
  function updateExpanded(rowIndex) {
    const newExpanded = {};
    newExpanded[rowIndex] = expanded[rowIndex] ? false : true; // eslint-disable-line no-unneeded-ternary
    setExpanded(newExpanded);
  }

  function getFiltered() {
    // this gets the actual filtered answers directly from the table. this.reactTable is a ref set below in the component
    const filteredAnswers = reactTable.current.getResolvedState().sortedData;
    messageStore.updateFilteredAnswers(filteredAnswers);
    setExpanded({});
  }

  // SubComponent displayed when expanding a Node column in table that represents a Set
  function subComponent(rowInfo) { // eslint-disable-line
    // console.log('rowInfo', rowInfo, 'nodeId / activeButtonKey', nodeId, activeButtonKey);
    return (
      <AnswersetTableSubComponent
        rowInfo={rowInfo}
        messageStore={messageStore}
        answersTableStore={answersTableStore}
        concepts={concepts}
      />
    );
  }

  const column = [{
    Header: 'Answer Set',
    columns: answersTableStore.columns,
  }];
  // these are for the download button
  const source = simpleExpand ? 'expand' : 'message';
  fileName = fileName || 'answers';
  return (
    <>
      {Object.keys(answersTableStore.answers).length ? (
        <Row style={{ marginTop: '10px' }}>
          <Col md={12}>
            <div style={{ marginBottom: '10px', position: 'relative' }}>
              <DownloadButton results={messageStore} source={source} fileName={fileName} />
              <ReactTable
                ref={reactTable}
                data={answersTableStore.answers}
                columns={column}
                defaultPageSize={10}
                defaultFilterMethod={defaultFilterMethod}
                pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
                minRows={10}
                filterable
                onFilteredChange={getFiltered}
                className="-highlight"
                collapseOnDataChange={false}
                onPageChange={() => setExpanded({})}
                onSortedChange={() => setExpanded({})}
                SubComponent={subComponent}
                expanded={expanded}
                defaultSorted={[
                  {
                    id: 'score',
                    desc: true,
                  },
                ]}
                getTdProps={(state, rowInfo, column, instance) => { // eslint-disable-line
                  return {
                    onClick: (e, handleOriginal) => {
                      // IMPORTANT! React-Table uses onClick internally to trigger
                      // events like expanding SubComponents and pivots.
                      // By default a custom 'onClick' handler will override this functionality.
                      // If you want to fire the original onClick handler, call the
                      // 'handleOriginal' function.
                      if (handleOriginal) {
                        handleOriginal();
                      }
                      // Trigger appropriate subcomponent depending on where user clicked
                      if (column.isSet) { // Handle user clicking on a "Set" element in a row
                        answersTableStore.setNodeId(column.id);
                        answersTableStore.setActiveButton(answersTableStore.subComponentEnum.metadata);
                        updateExpanded(rowInfo.viewIndex);
                      } else if (column.expander) { // Handle user clicking on the row Expander element (1st column)
                        answersTableStore.setNodeId(null);
                        answersTableStore.setActiveButton(answersTableStore.subComponentEnum.json);
                        updateExpanded(rowInfo.viewIndex);
                      }
                    },
                  };
                }}
                getTrProps={(state, rowInfo) => ({
                  className: rowInfo ? (isSelected(rowInfo) ? 'selected-row' : '') : '', // eslint-disable-line no-nested-ternary
                })}
              />
            </div>
          </Col>
        </Row>
      ) : (
        <Row>
          <Col md={12}>
            There do not appear to be any answers for this question.
          </Col>
        </Row>
      )}
    </>
  );
}
