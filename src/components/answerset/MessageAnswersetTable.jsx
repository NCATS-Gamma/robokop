import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-bootstrap';
import { observer } from 'mobx-react';
// import FaExternalLink from 'react-icons/lib/fa/external-link';
import ReactTable from 'react-table';
import ReactJson from 'react-json-view';
import 'react-table/react-table.css';

import entityNameDisplay from './../util/entityNameDisplay';

const _ = require('lodash');

// Filter method for table columns that is case-insensitive, and matches all rows that contain
// provided sub-string
const defaultFilterMethod = (filter, row, column) => { // eslint-disable-line no-unused-vars
  // console.log('filter, row, column', filter, row, column);
  const id = filter.pivotId || filter.id;
  return row[id] !== undefined ? String(row[id].toLowerCase()).includes(filter.value.toLowerCase()) : true;
};

const setFilterMethod = (filter, row, column) => { // eslint-disable-line no-unused-vars
  const id = filter.pivotId || filter.id;
  const combined = row[id].map(subNode => (subNode.name ? subNode.name : subNode.id)).join(' ');
  return String(combined.toLowerCase()).includes(filter.value.toLowerCase());
};

// Subcomponent for custom detailed view for each answer in the table row
const rowSubComponent = (rowInfo) => {
  const rowData = _.cloneDeep(rowInfo.original);
  console.log('rowInfo', rowInfo);
  // delete rowData.result_graph.edge_list;
  return (
    <div style={{ margin: '20px', border: '1px solid #ededed', padding: '20px', boxShadow: '0px 0px 5px 0px #ececec' }}>
      <ReactJson
        name={false}
        theme="rjv-default"
        collapseStringsAfterLength={110}
        indentWidth={2}
        iconStyle="triangle"
        src={rowData}
        displayDataTypes={false}
        collapsed={4}
      />
    </div>
  );
};

// const graphSubComponent = 

// SubComponent displayed when expanding a Node column in table that represents a Set
const setSubComponentFactory = (setData, column) => (rowInf) => { // eslint-disable-line
  // console.log('rowInfo', rowInf);
  return (
    <div style={{ padding: '20px 125px' }}>
      <ReactTable
        data={setData}
        columns={[{
          Header: `Nodes for the ${column.id} - ${entityNameDisplay(column.type)} Set`,
          columns: [
            { Header: 'Id', accessor: 'id' },
            { Header: 'Name', id: 'name', accessor: d => (d.name ? d.name : '') },
            { Header: 'Type', id: 'type', accessor: d => entityNameDisplay(d.type) },
          ],
        }]}
        defaultPageSize={5}
        defaultFilterMethod={defaultFilterMethod}
        pageSizeOptions={[5, 10, 15, 20]}
        minRows={1}
        filterable={setData.length > 5}
        showPagination={setData.length > 5}
        className="-striped -highlight"
      />
    </div>
  );
};

// Function to calculate sane column widths
const getColumnWidth = (data, accessor, headerText) => {
  if (typeof accessor === 'string' || accessor instanceof String) {
    accessor = d => d[accessor]; // eslint-disable-line no-param-reassign
  }
  const maxWidth = 600;
  const magicSpacing = 9;
  const cellLength = Math.max(
    ...data.map(row => (`${accessor(row)}` || '').length),
    headerText.length,
  );
  return Math.min(maxWidth, cellLength * magicSpacing);
};

@observer
class MessageAnswersetTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tableSubComponent: rowSubComponent,
      expanded: {},
      subComponentId: '',
      isError: false,
      error: null,
    };
    this.getReactTableColumnSpec = this.getReactTableColumnSpec.bind(this);
    this.updateTableSubComponent = this.updateTableSubComponent.bind(this);
  }

  getReactTableColumnSpec(columnHeaders, data) {
    // Take columnHeaders from store and update it as needed
    columnHeaders = columnHeaders.map((col) => { // eslint-disable-line no-param-reassign
      const colSpecObj = _.cloneDeep(col);
      const nodeId = colSpecObj.id;
      if (colSpecObj.isSet) {
        colSpecObj.accessor = d => d.nodes[nodeId].setNodes;
        colSpecObj.style = { cursor: 'pointer', userSelect: 'none' };
        colSpecObj.Cell = () => (
          <span>
            <span style={{ textAlign: 'center' }}>{`${entityNameDisplay(colSpecObj.type)} [Set]`}</span>
            <span className="pull-right">&#x2295;</span>
          </span>
        );
        colSpecObj.width = getColumnWidth(data, () => `${entityNameDisplay(colSpecObj.type)} [Set]   `, colSpecObj.Header);
        colSpecObj.filterMethod = setFilterMethod;
      } else {
        colSpecObj.accessor = d => (d.nodes[nodeId].name ? d.nodes[nodeId].name : d.nodes[nodeId].id);
        colSpecObj.width = getColumnWidth(data, colSpecObj.accessor, colSpecObj.Header);
      }
      return colSpecObj;
    });
    // Add Score column at the end
    columnHeaders.push({
      Header: 'Rank',
      id: 'score',
      // width: 75,
      filterable: false,
      accessor: 'score',
      Cell: d => <span className="number">{parseFloat(Math.round(d.value * 1000) / 1000).toFixed(3)}</span>,
      className: 'center',
    });
    return columnHeaders;
  }

  /**
   * Method to update table subcomponent and toggle expanded state of table appropriately
   * This method works around react-table limitations to enable multiple sub-components on
   * a per-column basis
   * @param {Int} rowIndex Index of the row clicked by the user
   * @param {String} newSubComponentId Subcomponent id (typically should be identical to the column.id of column clicked.
   *    'row' is a special id meant for the rowExpander column)
   * @param {JSX} newSubComponent 
   */
  updateTableSubComponent(rowIndex, newSubComponentId, newSubComponent) {
    const newExpanded = {};
    if (this.state.subComponentId === newSubComponentId) {
      // Toggle visibility if same subcomponent was currently active
      newExpanded[rowIndex] = this.state.expanded[rowIndex] ? false : true; // eslint-disable-line no-unneeded-ternary
    } else {
      // Keep visibility if different subComponent needs to be loaded
      newExpanded[rowIndex] = true;
    }
    const expanded = Object.assign({}, newExpanded);
    this.setState({ tableSubComponent: newSubComponent, expanded, subComponentId: newSubComponentId });
  }

  renderError() {
    console.log('Interactive Viewer Error Message', this.state.error);
    return (
      <Row>
        <Col md={12}>
          <h4>
            {'Sorry but we ran in to problems setting up the interactive viewer for this answer set.'}
          </h4>
          <p>
            Error Message:
          </p>
          <pre>
            {this.state.error.message}
          </pre>
        </Col>
      </Row>
    );
  }
  renderNoAnswers() {
    return (
      <Row>
        <Col md={12}>
          {'There does not appear to be any answers for this question.'}
        </Col>
      </Row>
    );
  }
  renderValid() {
    const { store } = this.props;
    const answerTables = store.answerSetTableData;
    const { headerInfo: columnHeaders, answers } = answerTables;
    const columns = [{
      Header: 'Answer Set',
      columns: this.getReactTableColumnSpec(columnHeaders, answers),
    }];
    return (
      <div style={{ marginBottom: '10px' }}>
        <ReactTable
          data={answers}
          columns={columns}
          defaultPageSize={10}
          defaultFilterMethod={defaultFilterMethod}
          pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
          minRows={5}
          filterable
          className="-striped -highlight"
          collapseOnDataChange={false}
          SubComponent={this.state.tableSubComponent}
          expanded={this.state.expanded}
          getTdProps={(state, rowInfo, column, instance) => { // eslint-disable-line
            return {
              onClick: (e, handleOriginal) => {
                // console.log('A Td Element was clicked!');
                // console.log('it produced this event:', e);
                // console.log('It was in this column:', column);
                // console.log('It was in this row:', rowInfo);
                // console.log('It was in this table instance:', instance);
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
                  const newSubComponent = setSubComponentFactory(column.accessor(rowInfo.original), column);
                  this.updateTableSubComponent(rowInfo.viewIndex, column.id, newSubComponent);
                } else if (column.expander) { // Handle user clicking on the row Expander element (1st column)
                  this.updateTableSubComponent(rowInfo.viewIndex, 'row', rowSubComponent);
                }
              },
            };
          }}
          // style={{ height: '480px' }}
        />
      </div>
    );
  }

  renderGroup() {
    // const isValid = this.state.groups.reduce((acc, c) => acc || c, false); // Valid if any valid answergroup exists
    // const selectOptions = this.state.groups.map((g, i) => ({ value: i, label: `${i + 1} - ${g.answers.length} answers each with ${g.nNodes} nodes.` }));
    // const oneGroup = selectOptions.length === 1;
    return (
      <Row>
        <Col md={12}>
          <Row style={{ marginTop: '10px' }}>
            {this.renderValid()}
          </Row>
        </Col>
      </Row>
    );
  }
  render() {
    const { isError } = this.state;
    const { store } = this.props;
    const hasAnswers = (store.message.answers && store.message.answers.length > 0);
    return (
      <div>
        {isError && this.renderError()}
        {!isError && hasAnswers && this.renderGroup()}
        {!isError && !hasAnswers && this.renderNoAnswers()}
      </div>
    );
  }
}

MessageAnswersetTable.propTypes = {
  store: PropTypes.any.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default MessageAnswersetTable;
