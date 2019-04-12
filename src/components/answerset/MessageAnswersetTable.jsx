import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-bootstrap';
import { observer } from 'mobx-react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
// import { DropdownList } from 'react-widgets';

import AnswersetFilter from '../shared/AnswersetFilter';
import AnswersetTableSubComponent, { answersetSubComponentEnum } from './AnswersetTableSubComponent';
import entityNameDisplay from './../util/entityNameDisplay';
import getNodeTypeColorMap from './../util/colorUtils';
import getColumnWidth from '../util/rtColumnWidth';

const _ = require('lodash');

@observer
class MessageAnswersetTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      columns: [],
      answers: [],
      tableSubComponent: this.subComponentFactory(),
      expanded: {},
    };

    this.reactTable = '';

    this.getReactTableColumnSpec = this.getReactTableColumnSpec.bind(this);
    this.updateTableSubComponent = this.updateTableSubComponent.bind(this);
    this.subComponentFactory = this.subComponentFactory.bind(this);
    this.clearExpanded = this.clearExpanded.bind(this);
    this.getFiltered = this.getFiltered.bind(this);
  }

  componentWillMount() {
    const { store } = this.props;
    const answerTables = store.answerSetTableData;
    const { headerInfo: columnHeaders, answers } = answerTables;
    console.log('answers', answers);
    this.initializeState(columnHeaders, answers);
  }

  // SubComponent displayed when expanding a Node column in table that represents a Set
  subComponentFactory = ({nodeId = null, activeButtonKey = answersetSubComponentEnum.graph} = {}) => (rowInfo) => { // eslint-disable-line
    // console.log('rowInfo', rowInfo, 'nodeId / activeButtonKey', nodeId, activeButtonKey);
    return (
      <AnswersetTableSubComponent
        rowInfo={rowInfo}
        store={this.props.store}
        activeButtonKey={activeButtonKey}
        nodeId={nodeId}
        concepts={this.props.concepts}
      />
    );
  };

  isSelected = rowInfo => Boolean(this.state.expanded[rowInfo.viewIndex]);

  // Filter method for table columns that is case-insensitive, and matches all rows that contain
  // provided sub-string
  defaultFilterMethod = (filter, row, column) => { // eslint-disable-line no-unused-vars
    // console.log('filter, row, column', filter, row, column);
    const id = filter.pivotId || filter.id;
    const columnInfo = row._original.nodes[id];
    let show = true;
    Object.keys(filter.value.selectedFilter).forEach((key) => {
      if (show && !filter.value.selectedFilter[key].includes(String(columnInfo[key]))) {
        show = false;
        return show;
      }
    });
    return show;
  };

  setFilterMethod = (filter, row, column) => { // eslint-disable-line no-unused-vars
    // console.log('filter, row, column', filter, row, column);
    const id = filter.pivotId || filter.id;
    const columnInfo = row[id];
    // const combined = row[id].map(subNode => (subNode.name ? subNode.name : subNode.id)).join(' ');
    let show = true;
    Object.keys(filter.value.selectedFilter).forEach((key) => {
      columnInfo.forEach((setAns) => {
        if (show && !filter.value.selectedFilter[key].includes(String(setAns[key]))) {
          show = false;
          return show;
        }
      });
      if (!show) {
        return show;
      }
    });
    return show;
  };

  initializeState(columnHeaders, answers) {
    const columns = this.getReactTableColumnSpec(columnHeaders, answers);
    this.setState({ answers, columns });
  }

  getReactTableColumnSpec(columnHeaders, data) {
    const { concepts, store } = this.props;
    const bgColorMap = getNodeTypeColorMap(concepts);
    // Take columnHeaders from store and update it as needed
    const colHeaders = columnHeaders.map((col) => {
      const colSpecObj = _.cloneDeep(col);
      const nodeId = colSpecObj.id;
      if (colSpecObj.isSet) {
        colSpecObj.accessor = d => d.nodes[nodeId].setNodes;
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
          const cellText = cellTextFn(row.value);
          return (
            <span>
              <span style={{ textAlign: 'center' }}>{`${cellText[0]} `}
                {(cellText.length > 1) &&
                  <span style={{ fontWeight: 'bold' }}>{cellText[1]}</span>
                }
              </span>
              <span className="pull-right">&#x2295;</span>
            </span>
          );
        };
        colSpecObj.width = getColumnWidth(
          data, colSpecObj.accessor, colSpecObj.Header,
          setNodes => `${cellTextFn(setNodes).join(' ')}   `,
        );
        colSpecObj.filterMethod = this.setFilterMethod;
      } else {
        colSpecObj.accessor = d => (d.nodes[nodeId].name ? d.nodes[nodeId].name : d.nodes[nodeId].id);
        colSpecObj.width = getColumnWidth(data, colSpecObj.accessor, colSpecObj.Header);
      }
      colSpecObj.Filter = props =>
        (<AnswersetFilter
          {...props}
          answers={data}
          store={store}
          columnId={nodeId}
        />);
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
      Cell: d => <span className="number">{parseFloat(Math.round(d.value * 1000) / 1000).toFixed(3)}</span>,
      className: 'center',
    });
    return colHeaders;
  }

  /**
   * Method to update table subcomponent and toggle expanded state of table appropriately
   * This method works around react-table limitations to enable multiple sub-components on
   * a per-column basis
   * @param {Int} rowIndex Index of the row clicked by the user
   * @param {JSX} newSubComponent
   */
  updateTableSubComponent(rowIndex, newSubComponent) {
    const expanded = {};
    expanded[rowIndex] = this.state.expanded[rowIndex] ? false : true; // eslint-disable-line no-unneeded-ternary
    this.setState({ tableSubComponent: newSubComponent, expanded });
  }

  clearExpanded() {
    this.setState({ expanded: {} });
  }

  getFiltered() {
    // this gets the actual filtered answers directly from the table. this.reactTable is a ref set below in the component
    const filteredAnswers = this.reactTable.getResolvedState().sortedData;
    const { store } = this.props;
    store.updateFilteredAnswers(filteredAnswers);
    this.setState({ expanded: {} });
  }

  render() {
    const {
      answers, columns, expanded, tableSubComponent,
    } = this.state;
    const column = [{
      Header: 'Answer Set',
      columns,
    }];
    return (
      <div>
        {Object.keys(answers).length ?
          <Row>
            <Col md={12}>
              <Row style={{ marginTop: '10px' }}>
                <div style={{ marginBottom: '10px', padding: '0 15px' }}>
                  <ReactTable
                    ref={(r) => { this.reactTable = r; }}
                    data={answers}
                    columns={column}
                    defaultPageSize={10}
                    defaultFilterMethod={this.defaultFilterMethod}
                    pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
                    minRows={7}
                    filterable
                    onFilteredChange={this.getFiltered}
                    className="-highlight"
                    collapseOnDataChange={false}
                    onPageChange={this.clearExpanded}
                    onSortedChange={this.clearExpanded}
                    SubComponent={tableSubComponent}
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
                            const newSubComponent = this.subComponentFactory({
                              nodeId: column.id,
                              activeButtonKey: answersetSubComponentEnum.metadata,
                            });
                            this.updateTableSubComponent(rowInfo.viewIndex, newSubComponent);
                          } else if (column.expander) { // Handle user clicking on the row Expander element (1st column)
                            this.updateTableSubComponent(rowInfo.viewIndex, this.subComponentFactory());
                          }
                        },
                      };
                    }}
                    getTrProps={(state, rowInfo) => ({
                          className: rowInfo ? (this.isSelected(rowInfo) ? 'selected-row' : '') : '', // eslint-disable-line no-nested-ternary
                        })
                      }
                  />
                </div>
              </Row>
            </Col>
          </Row>
          :
          <Row>
            <Col md={12}>
              {'There do not appear to be any answers for this question.'}
            </Col>
          </Row>
        }
      </div>
    );
  }
}

MessageAnswersetTable.propTypes = {
  store: PropTypes.any.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default MessageAnswersetTable;
