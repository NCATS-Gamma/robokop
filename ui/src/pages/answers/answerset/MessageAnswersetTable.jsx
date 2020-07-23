import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ReactTable from 'react-table';

// import { DropdownList } from 'react-widgets';

import AnswersetFilter from './AnswersetFilter';
import DownloadButton from '../../../components/shared/DownloadButton';
import AnswersetTableSubComponent, { answersetSubComponentEnum } from './AnswersetTableSubComponent';
import entityNameDisplay from '../../../utils/entityNameDisplay';
import getNodeTypeColorMap from '../../../utils/colorUtils';
import getColumnWidth from '../../../utils/rtColumnWidth';

const _ = require('lodash');

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
    const { columnHeaders, answers } = answerTables;
    this.initializeState(columnHeaders, answers);
  }

  componentDidMount() {
    const { store } = this.props;
    if (store.unknownNodes) {
      window.alert('We were able to retrieve the answers to this question. However, it seems there was an error retrieving some of the nodes. If you would like complete answers, please try asking this question again.');
    }
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
    // store default filter returns a boolean
    return this.props.store.defaultFilter(row);
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
        colSpecObj.accessor = d => (d[nodeId][0].name ? d[nodeId][0].name : d[nodeId][0].id);
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
          const setNodes = store.getSetNodes(row.index, row.column.id);
          const cellText = cellTextFn(setNodes);
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
      } else {
        colSpecObj.accessor = d => (d[nodeId][0].name ? d[nodeId][0].name : d[nodeId][0].id);
        colSpecObj.width = getColumnWidth(data, colSpecObj.accessor, colSpecObj.Header);
      }
      // this initializes the filter object for all nodes
      store.initializeFilter();
      colSpecObj.Filter = props =>
        (<AnswersetFilter
          {...props}
          qnodeId={nodeId}
          store={store}
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
    // these are for the download button
    const source = this.props.simpleExpand ? 'expand' : 'message';
    const fileName = this.props.fileName || 'answers';
    return (
      <div>
        {Object.keys(answers).length ?
          <Row style={{ marginTop: '10px' }}>
            <Col md={12}>
              <div style={{ marginBottom: '10px', position: 'relative' }}>
                <DownloadButton results={this.props.store} source={source} fileName={fileName} />
                <ReactTable
                  ref={(r) => { this.reactTable = r; }}
                  data={answers}
                  columns={column}
                  defaultPageSize={10}
                  defaultFilterMethod={this.defaultFilterMethod}
                  pageSizeOptions={[5, 10, 15, 20, 25, 30, 50]}
                  minRows={10}
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

export default MessageAnswersetTable;
