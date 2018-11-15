import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { observer } from 'mobx-react';
import FaExternalLink from 'react-icons/lib/fa/external-link';
import { DropdownList } from 'react-widgets';
import ReactTable from 'react-table';
import ReactJson from 'react-json-view';
import 'react-table/react-table.css';

import entityNameDisplay from './../util/entityNameDisplay';

const _ = require('lodash');

// Filter method for table columns that is case-insensitive, and matches all rows that contain
// provided sub-string
const defaultFilterMethod = (filter, row, column) => {
  const id = filter.pivotId || filter.id;
  return row[id] !== undefined ? String(row[id].toLowerCase()).includes(filter.value.toLowerCase()) : true;
};

// Subcomponent for custom detailed view for each answer in the table row
const subComponent = (rowInfo) => {
  const rowData = _.cloneDeep(rowInfo.original);
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


@observer
class MessageAnswersetTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      groups: [],
      isError: false,
      error: null,
    };
    this.getReactTableColumnSpec = this.getReactTableColumnSpec.bind(this);
  }

  getReactTableColumnSpec(columnHeaders) {
    // Take columnHeaders from store and update it as needed
    columnHeaders = columnHeaders.map((col) => {
      const colSpecObj = _.cloneDeep(col);
      const nodeId = colSpecObj.id;
      if (colSpecObj.isSet) {
        colSpecObj.accessor = d => d.nodes[nodeId].setNodes;
        colSpecObj.Cell = props => (
          <DropdownList
            data={props.value}
            placeholder={`Set: ${entityNameDisplay(colSpecObj.type)}`}
            textField={item => (item.name ? item.name : item.id)}
          />
        );
      } else {
        colSpecObj.accessor = d => (d.nodes[nodeId].name ? d.nodes[nodeId].name : d.nodes[nodeId].id);
      }
      return colSpecObj;
    });
    // Add Score column at the end
    columnHeaders.push({
      Header: 'Rank',
      id: 'score',
      width: 75,
      filterable: false,
      accessor: 'score',
      Cell: d => <span className="number">{parseFloat(Math.round(d.value * 1000) / 1000).toFixed(3)}</span>,
      className: 'center',
    });
    return columnHeaders;
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
      columns: this.getReactTableColumnSpec(columnHeaders),
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
          SubComponent={subComponent}
          // getTdProps={(state, rowInfo, column, instance) => {
          //   return {
          //     onClick: (e, handleOriginal) => {
          //       // console.log('A Td Element was clicked!');
          //       // console.log('it produced this event:', e);
          //       // console.log('It was in this column:', column);
          //       // console.log('It was in this row:', rowInfo);
          //       // console.log('It was in this table instance:', instance);
          //       // IMPORTANT! React-Table uses onClick internally to trigger
          //       // events like expanding SubComponents and pivots.
          //       // By default a custom 'onClick' handler will override this functionality.
          //       // If you want to fire the original onClick handler, call the
          //       // 'handleOriginal' function.
          //       if (handleOriginal) {
          //         handleOriginal();
          //       }
          //       // Only trigger view of answer if clicking in the "Link" column
          //       if (column.Header === 'Link') {
          //         const answerId = rowInfo.original.id;
          //         store.updateSelectedByAnswerId(answerId);
          //         this.props.callbackAnswerSelected({ id: answerId });
          //         this.props.handleTabSelect(answerSetTabEnum.answerList);
          //       }
          //     },
          //   };
          // }}
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

MessageAnswersetTable.defaultProps = {
  answersetFeedback: [],
};

export default MessageAnswersetTable;
