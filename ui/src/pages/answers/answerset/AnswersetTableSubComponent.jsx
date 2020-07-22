import React from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button, Modal, OverlayTrigger, Popover, Checkbox } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { observable, action } from 'mobx';
import { DropdownList } from 'react-widgets';
import { FaThList, FaClone, FaEllipsisH, FaFileText, FaAngleDown } from 'react-icons/fa';
import { IoNetwork } from 'react-icons/io';
import ReactJson from 'react-json-view';
import ReactTable from 'react-table';
import axios from 'axios';

import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

import entityNameDisplay from './../util/entityNameDisplay';
import getColumnWidth from '../util/rtColumnWidth';
import SubGraphViewer from '../shared/graphs/SubGraphViewer';
import Loading from '../Loading';
import AnswerExplorerInfo from '../shared/AnswerExplorerInfo';
import { config } from '../../index';
import getNodeTypeColorMap from './../util/colorUtils';

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
};

const { Handle } = Slider;

const handle = (props) => {
  const {
    value, dragging, index, ...restProps
  } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={`${value} Nodes`}
      visible={dragging}
      placement="top"
      key={index}
      overlayStyle={{ zIndex: 1061 }}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  );
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
      rowData: {},
      graph: {},
      loadedGraph: false,
      selectedEdge: {},
      showModal: false,
      hierarchical: '',
    };

    this.syncPropsWithState = this.syncPropsWithState.bind(this);
    this.fetchGraphSupport = this.fetchGraphSupport.bind(this);
    this.onGraphClick = this.onGraphClick.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleHierarchical = this.handleHierarchical.bind(this);
    this.modalClose = this.modalClose.bind(this);
  }

  componentDidMount() {
    // Set local state to correct button and nodeId if provided in props
    this.syncPropsWithState();
  }

  componentDidUpdate(prevProps) {
    if ((prevProps.nodeId !== this.props.nodeId) || (prevProps.activeButtonKey !== this.props.activeButtonKey) || (this.activeState.activeButton === 1 && !this.state.loadedGraph)) {
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
    const {
      nodeId, activeButtonKey, rowInfo, store,
    } = this.props;
    if (nodeId) {
      this.updateNodeId(nodeId);
    }
    if (activeButtonKey) {
      this.updateActiveButton(activeButtonKey);
    }
    const rowData = store.getDenseAnswer(rowInfo.original.id);
    const ansId = rowData.id;
    store.updateActiveAnswerId(ansId);
    let graph = store.activeAnswerGraph;
    // returns the array of calls to make, and an array of node pairs
    const { calls, nodes } = this.makeNodePairs(graph.nodes, graph.edges);
    // async calls for omnicorp publications
    this.fetchGraphSupport(calls)
      .then((result) => {
        const pubs = [];
        // put all the publications into one array
        result.forEach(graphTest => pubs.push(graphTest.data));
        // adds support edges to graph object
        graph = this.addSupportEdges(graph, pubs, nodes);
        // this signifies that the graph is updated and to display the SubGraphViewer
        this.setState({ graph, loadedGraph: true, rowData });
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
  }

  makeNodePairs(nodes, edges) {
    const axiosArray = [];
    const nodePairs = [];
    const addrFun = (id1, id2) => `${config.protocol}://${config.host}:${config.port}/api/omnicorp/${id1}/${id2}`;
    for (let i = 0; i < nodes.length; i += 1) {
      if (!(('isSet' in nodes[i]) && nodes[i].isSet)) {
        for (let m = i + 1; m < nodes.length; m += 1) {
          if (!(('isSet' in nodes[m]) && nodes[m].isSet)) {
            // Both i and m are not from a set.

            // builds the api call address and pushes it into an array for the promises
            const addr = addrFun(nodes[i].id, nodes[m].id);
            axiosArray.push(axios.get(addr));
            // putting the node pairs as an array into an array for when we make the edges
            nodePairs.push([nodes[i].id, nodes[m].id]);
          }
        }
      }
    }
    // We picked pairs of nodes, due to the way simple view works, we might have literature_co-occurence edges for additional nodes
    // We need to look through those edges and add those node pairs
    edges.forEach((e) => {
      if (e.type === 'literature_co-occurrence') {
        const existingPair = nodePairs.find(p => ((p[0] === e.source_id) && (p[1] === e.target_id)) || ((p[1] === e.source_id) && (p[0] === e.target_id)));
        if (!existingPair) {
          // We need to add this pair
          const addr = addrFun(e.source_id, e.target_id);
          axiosArray.push(axios.get(addr));
          nodePairs.push([e.source_id, e.target_id]);
        }
      }
    });

    const results = { calls: axiosArray, nodes: nodePairs };
    return results;
  }

  addSupportEdges(graph, edgePubs, nodes) {
    const { edges } = graph;
    const updatedGraph = graph;
    edgePubs.forEach((pubs, index) => {
      // we only want to add the edge if it has any publications
      if (pubs.length) {
        // We found some pubs to put on the edge
        // There could already be an edge to which we want to add the edges
        const thisEdge = edges.find((e) => {
          const matchesForward = (e.source_id === nodes[index][0]) && (e.target_id === nodes[index][1]);
          const matchesBackward = (e.target_id === nodes[index][0]) && (e.source_id === nodes[index][1]);
          const isSupport = (e.type === 'literature_co-occurrence');

          return isSupport && (matchesForward || matchesBackward);
        });

        if (thisEdge) {
          // We fould an edge
          thisEdge.publications = pubs;
        } else {
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
      }
    });
    updatedGraph.edges = edges;
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

  handleSliderChange(value) {
    this.props.store.updateNumAgNodes(value);
    this.setState({ loadedGraph: false });
  }

  handleHierarchical(checked) {
    const horizon = checked ? 'hierarchical' : '';
    this.setState({ hierarchical: horizon });
  }

  renderSubGraph() {
    const { store, concepts } = this.props;
    const {
      graph, selectedEdge, loadedGraph, showModal, hierarchical,
    } = this.state;
    let sliderPopover = <div>No answerset</div>;
    const maxSetNodes = store.maxNumAgNodes || 0;
    if (this.state.loadedGraph) {
      sliderPopover = (
        <Popover id={shortid.generate()}>
          <div style={{ marginTop: '10px', width: '300px' }}>
            {store.isAgPruned() ? (
              `Pruned graph showing top ${store.numAgSetNodes} set nodes`
            ) : (
              'Prune Graph'
            )}
            <Slider
              min={1}
              max={maxSetNodes}
              defaultValue={store.numAgSetNodes}
              onAfterChange={this.handleSliderChange}
              handle={handle}
            />
            <Checkbox checked={hierarchical} onChange={e => this.handleHierarchical(e.target.checked)}>Hierarchical</Checkbox>
          </div>
        </Popover>
      );
    }
    return (
      <div>
        {loadedGraph ?
          <div>
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: '270px',
                backgroundColor: '#fff',
                boxShadow: '-2px 2px 5px 0px #7777777d',
                zIndex: 100,
              }}
            >
              <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={sliderPopover}>
                <div
                  style={{
                    width: '100%', textAlign: 'center', cursor: 'pointer', padding: '10px', fontSize: '12px',
                  }}
                >
                  Graph Options <FaAngleDown />
                </div>
              </OverlayTrigger>
            </div>
            <SubGraphViewer
              subgraph={graph}
              concepts={concepts}
              layoutRandomSeed={Math.floor(Math.random() * 100)}
              layoutStyle={hierarchical}
              callbackOnGraphClick={this.onGraphClick}
              showSupport
              varyEdgeSmoothRoundness
              omitEdgeLabel={false}
              height={350}
            />
            <Modal
              show={showModal}
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
                  graph={graph}
                  selectedEdge={selectedEdge}
                  concepts={concepts}
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
    const { rowData } = this.state;
    return (
      <div style={{ margin: '10px 0px 10px 125px' }}>
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
  }

  renderMetadataView() {
    const { rowData } = this.state;
    if (!Object.keys(rowData).length) { // if user clicks on gene in table to show metadata, we need to sync props with state before continuing
      return null;
    }
    const colorMap = getNodeTypeColorMap(this.props.concepts);
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
      const whitelist = ['name', 'id', 'type'];
      const columnHeaders = [];
      let keys;
      if (nodes.length > 1) {
        // if the nodes passed in are a set
        let setKeys = new Set();
        // map over every key in all the set objects and make a list of all unique keys
        nodes.forEach(node => Object.keys(node).map(key => setKeys.add(key)));
        setKeys = [...setKeys].filter(key => !blacklist.includes(key));
        let firstKeys = setKeys.filter(key => whitelist.includes(key));
        firstKeys = firstKeys.sort();
        keys = firstKeys.concat(setKeys.filter(key => !whitelist.includes(key)));
      } else {
        // if the nodes are just a single node
        const node = Object.keys(nodes[0]).filter(key => !blacklist.includes(key));
        let firstKeys = node.filter(key => whitelist.includes(key));
        firstKeys = firstKeys.sort();
        keys = firstKeys.concat(node.filter(key => !whitelist.includes(key)));
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
                {row.value.map(value => <p key={shortid.generate()}>{value}</p>)}
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
    const { isSet } = rowData.nodes[this.activeState.nodeId];
    const metadata = isSet ? rowData.nodes[this.activeState.nodeId].setNodes : [rowData.nodes[this.activeState.nodeId]];
    const headerTitle = (
      isSet ? `Nodes for the ${this.activeState.nodeId} - ${entityNameDisplay(rowData.nodes[this.activeState.nodeId].type)} Set` :
        `Metadata for ${this.activeState.nodeId} - ${entityNameDisplay(rowData.nodes[this.activeState.nodeId].type)}`
    );
    const backgroundColor = colorMap(rowData.nodes[this.activeState.nodeId].type);
    const tableFragment = (
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
    );
    return (
      <div style={{ padding: '10px 20px 0px 125px' }}>
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
            position: 'relative',
            backgroundColor: '#fff',
            border: '1px solid #ededed',
            boxShadow: '0px 0px 5px 0px #ececec',
            minHeight: '200px',
            width: '1000px',
          }}
        >
          <ButtonGroup
            vertical
            style={{
              position: 'absolute', top: '10px', left: '10px', zIndex: 1,
            }}
          >
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
          {isJsonActive && this.renderJsonView()}
          {isGraphActive && this.renderSubGraph()}
          {isMetadataActive && this.renderMetadataView()}
        </div>
      </div>
    );
  }
}

AnswersetTableSubComponent.defaultProps = defaultProps;
AnswersetTableSubComponent.propTypes = propTypes;

export default AnswersetTableSubComponent;
export { answersetSubComponentEnum };
