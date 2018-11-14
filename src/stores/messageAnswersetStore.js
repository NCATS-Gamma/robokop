import { observable, action, computed, configure, runInAction } from 'mobx';
// import Fuse from 'fuse-js-latest';

// import entityNameDisplay from '../components/util/entityNameDisplay';
// import AppConfig from '../AppConfig';

// const config = require('../../config.json');
const _ = require('lodash');


configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

class AnswersetStore {
  message = {}; // Message object supplied to store on init
  qNodeIdToIndMap = new Map();
  qEdgeIdToIndMap = new Map();
  kgNodeIdToIndMap = new Map();
  kgEdgeIdToIndMap = new Map();
  ansIdToIndMap = new Map();

  @observable activeAnswerId = null; // Currently 'selected' answer
  // @observable updateSelectedSubGraphIndexCallback = () => {};
  // @observable filterText = '';
  // @observable selectedSubGraphIndex = 0;
  @observable setSquashThresh = 5; // If more than these many nodes in a set, squash it in activeAnswerGraph
  constructor(message) {
    this.message = message;
    // Assign id to each answer if not present in supplied message
    this.message.answers.forEach((a, i) => {
      if (!a.id) {
        a.id = i;
      }
    });
    this.setupMaps();
    runInAction(() => (this.activeAnswerId = this.message.answers[0].id));
  }

  // Setup Maps from ids to indices for efficient referencing of nodes and edges during processing
  setupMaps() {
    this.message.question_graph.nodes.forEach((n, i) => this.qNodeIdToIndMap.set(n.id, i));
    this.message.question_graph.edges.forEach((e, i) => this.qEdgeIdToIndMap.set(e.id, i));
    this.message.knowledge_graph.nodes.forEach((n, i) => this.kgNodeIdToIndMap.set(n.id, i));
    this.message.knowledge_graph.edges.forEach((e, i) => this.kgEdgeIdToIndMap.set(e.id, i));
    this.message.answers.forEach((ans, i) => this.ansIdToIndMap.set(ans.id, i));
  }

  getQNode(nodeId) {
    return this.message.question_graph.nodes[this.qNodeIdToIndMap.get(nodeId)];
  }
  getQEdge(edgeId) {
    return this.message.question_graph.edges[this.qEdgeIdToIndMap.get(edgeId)];
  }
  getKgNode(nodeId) {
    return this.message.knowledge_graph.nodes[this.kgNodeIdToIndMap.get(nodeId)];
  }
  getKgEdge(edgeId) {
    return this.message.knowledge_graph.edges[this.kgEdgeIdToIndMap.get(edgeId)];
  }

  // Returns subgraphViewer compatible format graph spec { node_list: {}, edge_list: {} }
  @computed get activeAnswerGraph() {
    const answer = this.message.answers[this.ansIdToIndMap.get(this.activeAnswerId)];
    const graph = { node_list: [], edge_list: [] };
    const bindingsMap = new Map(Object.entries(answer.bindings));
    const qNodeIdsToSquash = [];
    // Process all Nodes in answer first. NOTE: nodeId is always kgNodeId except if it is squashed
    // in which case it is set to qNodeId for the squashed node
    bindingsMap.forEach((val, keyId) => {
      if (this.qNodeIdToIndMap.has(keyId)) {
        const qNode = this.getQNode(keyId);
        let nodeObj = { type: qNode.type, id: val };
        if (!Array.isArray(val)) { // This node is not a Set
          const kgNode = this.getKgNode(val);
          nodeObj.name = kgNode.name;
        } else {
          // Handle multiple nodes for sets
          if (val.length > this.setSquashThresh) { // eslint-disable-line no-lonely-if
            qNodeIdsToSquash.push(keyId);
            nodeObj.name = nodeObj.type;
            nodeObj.id = keyId; // Map node for a squashed set to the corresponding questionGraph node id
            nodeObj.isSquashed = true;
            nodeObj.unsquashedNodes = val.map(kgNodeId => this.getKgNode(kgNodeId));
          } else {
            const setNodes = val;
            nodeObj = setNodes.map(setNodeKgId => ({ type: qNode.type, id: setNodeKgId, name: this.getKgNode(setNodeKgId).name }));
          }
        }
        // Update node_list in the graph datastructure
        if (!Array.isArray(nodeObj)) {
          nodeObj = [nodeObj];
        }
        nodeObj.forEach(nObj => graph.node_list.push(_.cloneDeep(nObj)));
      }
    });

    // Process all Edges in answer after nodes
    bindingsMap.forEach((val, keyId) => {
      if (this.qEdgeIdToIndMap.has(keyId)) { // This is an edge
        const qEdge = this.getQEdge(keyId);
        // Force kgEdgeIds in answer to always be a list of kgEdgeId(s)
        if (!Array.isArray(val)) {
          val = [val];
        }
        let edgeObj = {};
        if ((qNodeIdsToSquash.indexOf(qEdge.source_id) !== -1) || (qNodeIdsToSquash.indexOf(qEdge.target_id) !== -1)) {
          // Squash to single edge
          edgeObj = {
            id: qEdge.id,
            source_id: (qNodeIdsToSquash.indexOf(qEdge.source_id) !== -1) ? qEdge.source_id : this.getKgEdge(val[0]).source_id,
            target_id: (qNodeIdsToSquash.indexOf(qEdge.target_id) !== -1) ? qEdge.target_id : this.getKgEdge(val[0]).target_id,
            isSquashed: true,
            unsquashedEdges: val.map(kgEdgeId => this.getKgEdge(kgEdgeId)),
          };
          // Copy type specified in question (if specified) for squashed edge
          if (qEdge.hasOwnProperty('type')) {
            edgeObj.type = qEdge.type;
          }
        } else {
          // Process all the edges (no squashing required)
          edgeObj = val.map(kgEdgeId => this.getKgEdge(kgEdgeId));
        }
        // Update edge_list in the graph datastructure
        if (!Array.isArray(edgeObj)) {
          edgeObj = [edgeObj];
        }
        edgeObj.forEach(eObj => graph.edge_list.push(_.cloneDeep(eObj)));
      }
    });
    return graph;
  }

  @action updateActiveAnswerId(ansId) {
    if (this.ansIdToIndMap.has(ansId)) {
      this.activeAnswerId = ansId;
    } else {
      console.error('Invalid answerId supplied to `updateActiveAnswerId()` method. Ignoring...');
    }
  }

  @action updateSetSquashThresh(thresh) {
    this.setSquashThresh = thresh;
  }
}

export default AnswersetStore;
