import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { observable, action } from 'mobx';
import { DropdownList } from 'react-widgets';
import FaThList from 'react-icons/lib/fa/th-list';
import FaClone from 'react-icons/lib/fa/clone';
import FaFileText from 'react-icons/lib/fa/file-text';
import IoNetwork from 'react-icons/lib/io/network';
// import IoCodeWorking from 'react-icons/lib/io/code-working'
import ReactJson from 'react-json-view';
import ReactTable from 'react-table';
import 'react-table/react-table.css';

import entityNameDisplay from './../util/entityNameDisplay';
import SubGraphViewer from '../shared/SubGraphViewer';

const _ = require('lodash');

const answersetSubComponentEnum = {
  graph: 1,
  json: 2,
  metadata: 3,
};

const defaultProps = {
  nodeId: null, // NodeId for the set being explored
  activeButtonKey: answersetSubComponentEnum.graph,
};

const propTypes = {
  store: PropTypes.any.isRequired, // eslint-disable-line react/forbid-prop-types
  nodeId: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  activeButtonKey: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  rowInfo: PropTypes.shape({
    original: PropTypes.object.isRequired,
  }).isRequired,
};

@observer
class AnswersetTableSubComponent extends React.Component {
  @observable activeState = {
    activeButton: answersetSubComponentEnum.graph,
    nodeId: null,
  };

  constructor(props) {
    super(props);
    this.syncPropsWithState = this.syncPropsWithState.bind(this);

    // Set local state to correct button and nodeId if provided in props
    this.syncPropsWithState();
  }

  componentWillUpdate(nextProps) {
    if ((nextProps.nodeId !== this.props.nodeId) || (nextProps.activeButtonKey !== this.props.activeButtonKey)) {
      this.syncPropsWithState();
    }
  }

  @action.bound updateNodeId(id) {
    this.activeState.nodeId = id;
  }
  @action.bound updateActiveButton(activeButtonKey) {
    this.activeState.activeButton = activeButtonKey;
  }

  // Method that updates local mobx state with activeButton and nodeId based on props
  syncPropsWithState() {
    const { nodeId, activeButtonKey } = this.props;
    if (nodeId) {
      this.updateNodeId(nodeId);
    }
    if (activeButtonKey) {
      this.updateActiveButton(activeButtonKey);
    }
  }

  renderSubGraph() {
    const rowData = _.cloneDeep(this.props.rowInfo.original);
    const ansId = rowData.id;
    this.props.store.updateActiveAnswerId(ansId);
    const graph = this.props.store.activeAnswerGraph;
    return (
      <SubGraphViewer
        subgraph={graph}
        concepts={this.props.concepts}
        layoutRandomSeed={Math.floor(Math.random() * 100)}
        callbackOnGraphClick={() => {}}
        height={350}
      />
    );
  }

  renderJsonView() {
    const rowData = _.cloneDeep(this.props.rowInfo.original);
    return (
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
    );
  }

  renderMetadataView() {
    const rowData = _.cloneDeep(this.props.rowInfo.original);

    // Filter method for table columns that is case-insensitive, and matches all rows that contain
    // provided sub-string
    const defaultFilterMethod = (filter, row, column) => { // eslint-disable-line no-unused-vars
      // console.log('filter, row, column', filter, row, column);
      const id = filter.pivotId || filter.id;
      return row[id] !== undefined ? String(row[id].toLowerCase()).includes(filter.value.toLowerCase()) : true;
    };

    const nodeList = Object.keys(rowData.nodes);

    if (!this.activeState.nodeId) { // Set default nodeId if null
      this.updateNodeId(nodeList[0]);
    }

    const dropDownData = nodeList.map(nodeId => ({
      nodeId,
      isSet: rowData.nodes[nodeId].isSet,
      type: entityNameDisplay(rowData.nodes[nodeId].type),
    }));
    const ListItem = ({ item }) => (
      <span>
        <strong>{`${item.nodeId}: `}</strong>{`${item.type} `}<span className="">{item.isSet && <FaClone />}</span>
      </span>
    );
    const dropDownComponent = (
      <div style={{ width: '300px', marginBottom: '5px' }}>
        <DropdownList
          data={dropDownData}
          value={dropDownData.filter(el => el.nodeId === this.activeState.nodeId)[0]}
          // dropUp
          textField="label"
          valueField="nodeId"
          onChange={val => this.updateNodeId(val.nodeId)}
          itemComponent={ListItem}
          valueComponent={ListItem}
        />
      </div>
    );

    const isSet = rowData.nodes[this.activeState.nodeId].isSet; // eslint-disable-line prefer-destructuring
    let tableFragment;
    if (isSet) {
      const setData = rowData.nodes[this.activeState.nodeId].setNodes;
      tableFragment = (
        <ReactTable
          data={setData}
          columns={[{
            Header: `Nodes for the ${this.activeState.nodeId} - ${entityNameDisplay(rowData.nodes[this.activeState.nodeId].type)} Set`,
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
          className="-highlight"
        />
      );
    } else {
      const metadata = [rowData.nodes[this.activeState.nodeId]];
      tableFragment = (
        <ReactTable
          data={metadata}
          columns={[{
            Header: `Metadata for ${this.activeState.nodeId} - ${entityNameDisplay(rowData.nodes[this.activeState.nodeId].type)}`,
            columns: [
              { Header: 'Id', accessor: 'id' },
              { Header: 'Name', id: 'name', accessor: d => (d.name ? d.name : '') },
              { Header: 'Type', id: 'type', accessor: d => entityNameDisplay(d.type) },
            ],
          }]}
          minRows={1}
          filterable={false}
          showPagination={false}
          sortable={false}
          className="-highlight"
        />
      );
    }
    return (
      <div style={{ padding: '0px 20px 0px 0px' }}>
        {dropDownComponent}
        {tableFragment}
      </div>
    );
  }

  render() {
    const { activeButton } = this.activeState;
    const isJsonActive = activeButton === answersetSubComponentEnum.json;
    const isGraphActive = activeButton === answersetSubComponentEnum.graph;
    const isMetadataActive = activeButton === answersetSubComponentEnum.metadata;
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fafafa',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #ededed',
            padding: '20px',
            boxShadow: '0px 0px 5px 0px #ececec',
            minHeight: '200px',
          }}
        >
          <Row>
            <Col md={2}>
              <ButtonGroup vertical style={{ float: 'left' }}>
                <Button
                  active={isJsonActive}
                  style={{ textAlign: 'left' }}
                  onClick={() => this.updateActiveButton(answersetSubComponentEnum.json)}
                >
                  <span className="valign-center"><FaFileText /><span style={{ paddingLeft: '5px' }}>JSON</span></span>
                </Button>
                <Button
                  active={isGraphActive}
                  style={{ textAlign: 'left' }}
                  onClick={() => this.updateActiveButton(answersetSubComponentEnum.graph)}
                >
                  <div className="valign-center"><IoNetwork /><span style={{ paddingLeft: '5px' }}>Graph</span></div>
                </Button>
                <Button
                  active={isMetadataActive}
                  style={{ textAlign: 'left' }}
                  onClick={() => this.updateActiveButton(answersetSubComponentEnum.metadata)}
                >
                  <span className="valign-center"><FaThList /><span style={{ paddingLeft: '5px' }}>Metadata</span></span>
                </Button>
              </ButtonGroup>
            </Col>
            <Col md={10}>
              {isJsonActive && this.renderJsonView()}
              {isGraphActive && this.renderSubGraph()}
              {isMetadataActive && this.renderMetadataView()}
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

AnswersetTableSubComponent.defaultProps = defaultProps;
AnswersetTableSubComponent.propTypes = propTypes;

export default AnswersetTableSubComponent;
export { answersetSubComponentEnum };
