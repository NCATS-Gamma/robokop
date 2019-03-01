import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, ButtonGroup, Button, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { observable, action } from 'mobx';
import { DropdownList } from 'react-widgets';
import FaThList from 'react-icons/lib/fa/th-list';
import FaClone from 'react-icons/lib/fa/clone';
import FaFileText from 'react-icons/lib/fa/file-text';
import IoNetwork from 'react-icons/lib/io/network';
import FaEllipsisH from 'react-icons/lib/fa/ellipsis-h';
// import IoCodeWorking from 'react-icons/lib/io/code-working'
import ReactJson from 'react-json-view';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import axios from 'axios';

import entityNameDisplay from './../util/entityNameDisplay';
import getColumnWidth from '../util/rtColumnWidth';
import SubGraphViewer from '../shared/SubGraphViewer';
import Loading from '../Loading';
import AnswerExplorerInfo from '../shared/AnswerExplorerInfo';
import { config } from '../../index';

const _ = require('lodash');
const shortid = require('shortid');

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

    this.state = {
      graph: {},
      loadedGraph: false,
      selectedEdge: {},
      showModal: false,
    };

    this.syncPropsWithState = this.syncPropsWithState.bind(this);
    this.fetchGraphSupport = this.fetchGraphSupport.bind(this);
    this.onGraphClick = this.onGraphClick.bind(this);
    this.modalClose = this.modalClose.bind(this);
  }

  componentDidMount() {
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
    const rowData = _.cloneDeep(this.props.rowInfo.original);
    const ansId = rowData.id;
    this.props.store.updateActiveAnswerId(ansId);
    let graph = this.props.store.activeAnswerGraph;
    // returns the array of calls to make, and an array of node pairs
    const { calls, nodes } = this.makeNodePairs(graph.node_list);
    // async calls for omnicorp publications
    this.fetchGraphSupport(calls)
      .then((result) => {
        const pubs = [];
        // put all the publications into one array
        result.forEach(graphTest => pubs.push(graphTest.data));
        // adds support edges to graph object
        graph = this.addSupportEdges(graph, pubs, nodes);
        // this signifies that the graph is updated and to display the SubGraphViewer
        this.setState({ graph, loadedGraph: true });
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
  }

  makeNodePairs(nodes) {
    const axiosArray = [];
    const nodePairs = [];
    for (let i = 0; i < nodes.length; i += 1) {
      if (('isSet' in nodes[i]) && nodes[i].isSet) {
        for (let m = i + 1; m < nodes.length; m += 1) {
          if (('isSet' in nodes[m]) && nodes[m].isSet) {
            // builds the api call address and pushes it into an array for the promises
            const addr = `${config.protocol}://${config.host}:${config.port}/api/omnicorp/${nodes[i].id}/${nodes[m].id}`;
            axiosArray.push(axios.get(addr));
            // putting the node pairs as an array into an array for when we make the edges
            nodePairs.push([nodes[i].id, nodes[m].id]);
          }
        }
      }
    }
    const results = { calls: axiosArray, nodes: nodePairs };
    return results;
  }

  addSupportEdges(graph, edgePubs, nodes) {
    const edges = graph.edge_list;
    const updatedGraph = graph;
    edgePubs.forEach((pubs, index) => {
      // we only want to add the edge if it has any publications
      if (pubs.length) {
        const newEdge = {
          publications: pubs,
          type: 'literature_co-occurrence',
          source_database: 'omnicorp',
          source_id: nodes[index][0],
          target_id: nodes[index][1],
          id: shortid.generate(),
        };
        edges.push(newEdge);
      }
    });
    updatedGraph.edge_list = edges;
    return updatedGraph;
  }

  fetchGraphSupport(axiosCalls) {
    // async call all of the axios calls for edge publications
    return Promise.all(axiosCalls);
  }

  modalClose() {
    this.setState({ showModal: false });
  }

  onGraphClick(event) {
    if (event.edges.length !== 0) { // Clicked on an Edge
      this.setState({ selectedEdge: event.edgeObjects[0], showModal: true });
    } else { // Reset things since something else was clicked
      this.setState({ selectedEdge: null, showModal: false });
    }
  }

  renderSubGraph() {
    return (
      <div>
        {this.state.loadedGraph ?
          <div>
            <SubGraphViewer
              subgraph={this.state.graph}
              concepts={this.props.concepts}
              layoutRandomSeed={Math.floor(Math.random() * 100)}
              callbackOnGraphClick={this.onGraphClick}
              showSupport
              omitEdgeLabel={false}
              height={350}
            />
            <Modal
              show={this.state.showModal}
              onHide={this.modalClose}
              container={this}
              bsSize="large"
              aria-labelledby="AnswerExplorerModal"
            >
              <Modal.Header closeButton>
                <Modal.Title id="AnswerExplorerModalTitle">Edge Explorer</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <AnswerExplorerInfo
                  graph={this.state.graph}
                  selectedEdge={this.state.selectedEdge}
                  concepts={this.props.concepts}
                />
              </Modal.Body>
            </Modal>
          </div>
          :
          <Loading />
        }
      </div>
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
    const getColumnSpecs = (nodes) => {
      const blacklist = ['isSet'];
      const columnHeaders = [];
      if (nodes.length > 1) {
        // if the nodes passed in are a set
        nodes.map((node, index) => {
          const columnHeaderObj = _.cloneDeep(node);
          columnHeaderObj.Header = Object.keys(node)[index];
          columnHeaderObj.accessor = columnHeaderObj.Header;
          columnHeaderObj.width = getColumnWidth(nodes, columnHeaderObj.accessor, columnHeaderObj.Header);
          columnHeaderObj.Cell = (row) => {
            // if the value is an array, show each one on a new line, otherwise, just display the single value
            if (Array.isArray(row.value) && row.value.length > 1) {
              const arrayPopover = (
                <Popover id={shortid.generate()}>
                  {row.value.map(value => <p key={shortid.generate()}>{value}</p>)}
                </Popover>
              );
              return (
                <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={arrayPopover}>
                  <FaEllipsisH size={25} />
                </OverlayTrigger>
              );
            }
            return <div>{row.value}</div>;
          };
          return columnHeaders.push(columnHeaderObj);
        });
      } else {
        // if the nodes are just a single node
        Object.keys(nodes[0]).map((key) => {
          if (!blacklist.includes(key)) {
            const columnHeaderObj = {};
            if (typeof nodes[0][key] === 'boolean') {
              nodes[0][key] = nodes[0][key] ? 'Yes' : 'No';
            }
            columnHeaderObj.Header = key;
            columnHeaderObj.accessor = key;
            columnHeaderObj.width = getColumnWidth(nodes, columnHeaderObj.accessor, columnHeaderObj.Header);
            columnHeaderObj.Cell = (row) => {
              // if the value is an array, show each one on a new line, otherwise, just display the single value
              if (Array.isArray(row.value) && row.value.length > 1) {
                const arrayPopover = (
                  <Popover id={shortid.generate()}>
                    {row.value.map(value => <p key={shortid.generate()}>{value}</p>)}
                  </Popover>
                );
                return (
                  <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={arrayPopover} style={{ cursor: 'pointer' }}>
                    <FaEllipsisH size={15} />
                  </OverlayTrigger>
                );
              }
              return <div>{row.value}</div>;
            };
            return columnHeaders.push(columnHeaderObj);
          }
          return false;
        });
      }
      return columnHeaders;
    };
    const { isSet } = rowData.nodes[this.activeState.nodeId];
    const metadata = isSet ? rowData.nodes[this.activeState.nodeId].setNodes : [rowData.nodes[this.activeState.nodeId]];
    const headerTitle = (
      isSet ? `Nodes for the ${this.activeState.nodeId} - ${entityNameDisplay(rowData.nodes[this.activeState.nodeId].type)} Set` :
        `Metadata for ${this.activeState.nodeId} - ${entityNameDisplay(rowData.nodes[this.activeState.nodeId].type)}`
    );
    const tableFragment = (
      <ReactTable
        data={metadata}
        columns={[{
          Header: headerTitle,
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
    );
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
          width: '100%',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #ededed',
            padding: '20px',
            boxShadow: '0px 0px 5px 0px #ececec',
            minHeight: '200px',
            width: '900px',
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
