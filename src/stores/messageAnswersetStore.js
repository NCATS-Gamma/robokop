import { observable, action, computed, configure, runInAction, isObservableArray, toJS } from 'mobx';
// import Fuse from 'fuse-js-latest';

import entityNameDisplay from '../components/util/entityNameDisplay';
// import AppConfig from '../AppConfig';

// const config = require('../../config.json');
const _ = require('lodash');


configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

class AnswersetStore {
  @observable message = {}; // Message object supplied to store on init
  @observable activeAnswerId = null; // Currently 'selected' answer
  @observable setSquashThresh = 5; // If more than these many nodes in a set, squash it in activeAnswerGraph

  constructor(message) {
    runInAction(() => {
      this.message = message;
      // Assign id to each answer if not present in supplied message
      this.message.answers.forEach((a, i) => {
        if (!a.id) {
          a.id = i; // eslint-disable-line no-param-reassign
        }
      });
      this.activeAnswerId = this.message.answers[0].id;
    });
  }

  @computed get qNodeIdToIndMap() {
    const indMap = new Map();
    if (this.message.question_graph) {
      this.message.question_graph.nodes.forEach((n, i) => indMap.set(n.id, i));
    }
    return indMap;
  }
  @computed get qEdgeIdToIndMap() {
    const indMap = new Map();
    if (this.message.question_graph) {
      this.message.question_graph.edges.forEach((e, i) => indMap.set(e.id, i));
    }
    return indMap;
  }
  @computed get kgNodeIdToIndMap() {
    const indMap = new Map();
    if (this.message.knowledge_graph) {
      this.message.knowledge_graph.nodes.forEach((n, i) => indMap.set(n.id, i));
    }
    return indMap;
  }
  @computed get kgEdgeIdToIndMap() {
    const indMap = new Map();
    if (this.message.knowledge_graph) {
      this.message.knowledge_graph.edges.forEach((e, i) => indMap.set(e.id, i));
    }
    return indMap;
  }
  @computed get ansIdToIndMap() {
    const indMap = new Map();
    if (this.message.answers) {
      this.message.answers.forEach((ans, i) => indMap.set(ans.id, i));
    }
    return indMap;
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

  // Returns formatted answerset data for tabular display
  // {
  //   answers: [{ nodes: {n0: {name: , id: , type: , isSet, setNodes?: }, n1: {}, ...}, score: -1 }, {}, ...],
  //   headerInfo: [{ Header: 'n01: Gene', id: 'n01', isSet: false, type: 'gene'}, {}, ...],
  // }
  @computed get answerSetTableData() {
    const qNodeIds = [];
    const headerInfo = [];
    this.message.question_graph.nodes.forEach((n) => {
      headerInfo.push({
        Header: `${n.id}: ${entityNameDisplay(n.type)}`,
        id: n.id,
        isSet: n.set,
        type: n.type,
      });
      qNodeIds.push(n.id);
    });
    const qEdgeIds = [];
    this.message.question_graph.edges.forEach((e) => {
      qEdgeIds.push(e.id);
    });
    const answers = [];
    this.message.answers.forEach((ans) => {
      const ansObj = {
        score: ans.score, nodes: {}, edges: {}, id: ans.id,
      };
      qNodeIds.forEach((qNodeId) => {
        const qNode = this.getQNode(qNodeId);
        let nodeListObj = { type: qNode.type, isSet: false };
        if (!isObservableArray(ans.node_bindings[qNodeId])) {
          // This is not a set node
          nodeListObj = { ...nodeListObj, ...toJS(this.getKgNode(ans.node_bindings[qNodeId])) };
        } else {
          // Set
          nodeListObj = { type: qNode.type, name: `Set: ${entityNameDisplay(qNode.type)}`, isSet: true };
          nodeListObj.setNodes = ans.node_bindings[qNodeId].map(kgNodeId => toJS(this.getKgNode(kgNodeId)));
        }
        ansObj.nodes[qNodeId] = nodeListObj;
      });
      qEdgeIds.forEach((qEdgeId) => {
        let cEdgeIds = [];
        if (!isObservableArray(ans.edge_bindings[qEdgeId])) { // Just a single id
          cEdgeIds = [ans.edge_bindings[qEdgeId]];
        } else { // we already have an array.
          cEdgeIds = ans.edge_bindings[qEdgeId];
        }

        ansObj.edges[qEdgeId] = cEdgeIds.map(eid => toJS(this.getKgEdge(eid)));
      });
      answers.push(ansObj);
    });
    return toJS({ answers, headerInfo });
  }
  @computed get annotatedKnowledgeGraph() {
    // KG nodes don't always have type
    // If they don't we need to figure out which qNodes they most like correspond to
    // Then check labels and use the corresponding type

    const graph = this.message.knowledge_graph;

    if (this.message.question_graph) {
      const qNodes = this.message.question_graph.nodes;
      const qNodeBindings = qNodes.map(q => q.id);

      graph.nodes.forEach((n) => {
        if (!('type' in n)) {
          const qNodeCounts = qNodeBindings.map(() => 0);

          this.message.answers.forEach((a) => {
            // Go through answers and look for this node
            Object.keys(a.node_bindings).forEach((key) => {
              if (a.node_bindings[key] === n.id) {
                // This answer lists this node as qNode: key
                qNodeCounts[qNodeBindings.indexOf(key)] += 1;
              }
            });
          });
          // See what question node this was mapped to most
          const maxCounts = qNodeCounts.reduce((m, val) => Math.max(m, val));
          const qNodeIndex = qNodeCounts.indexOf(maxCounts);

          // Use that Q Nodes Type
          n.type = qNodes[qNodeIndex].type; // eslint-disable-line no-param-reassign
        }
      });
    }

    return toJS(graph);
  }

  // Returns subgraphViewer compatible format graph spec { node_list: {}, edge_list: {} }
  @computed get activeAnswerGraph() {
    const answer = this.message.answers[this.ansIdToIndMap.get(this.activeAnswerId)];
    const graph = { node_list: [], edge_list: [] };
    const bindingsMap = new Map(Object.entries(answer.node_bindings));
    const qNodeIdsToSquash = [];
    const squashedKgNodeIdToQnodeId = new Map(); // Store mapping from kgNodeId to qNodeId for all squashed nodes
    // Process all Nodes in answer first. NOTE: nodeId is always kgNodeId except if it is squashed
    // in which case it is set to qNodeId for the squashed node
    bindingsMap.forEach((val, keyId) => {
      if (this.qNodeIdToIndMap.has(keyId)) { // This is a node
        const qNode = this.getQNode(keyId);
        let nodeObj = { type: qNode.type, id: val, qNodeId: keyId };
        if (!isObservableArray(val)) { // This node is not a Set
          const kgNode = this.getKgNode(val);
          nodeObj.name = kgNode.name;
        } else {
          // Handle multiple nodes for sets
          if (val.length > this.setSquashThresh) { // eslint-disable-line no-lonely-if
            qNodeIdsToSquash.push(keyId);
            val.forEach(kgNodeId => squashedKgNodeIdToQnodeId.set(kgNodeId, keyId)); // Update map of kgNodeId -> qNodeId
            nodeObj.name = nodeObj.type;
            nodeObj.id = keyId; // Map node for a squashed set to the corresponding questionGraph node id
            nodeObj.isSquashed = true;
            nodeObj.unsquashedNodes = val.map(kgNodeId => this.getKgNode(kgNodeId));
          } else {
            const setNodes = val;
            nodeObj = setNodes.map(setNodeKgId => ({
              type: qNode.type,
              id: setNodeKgId,
              name: this.getKgNode(setNodeKgId).name,
              qNodeId: keyId,
            }));
          }
        }
        // Update node_list in the graph datastructure
        if (!isObservableArray(nodeObj) && !Array.isArray(nodeObj)) {
          nodeObj = [nodeObj];
        }
        nodeObj.forEach(nObj => graph.node_list.push(_.cloneDeep(toJS(nObj))));
      }
    });

    const bindingsMapEdges = new Map(Object.entries(answer.edge_bindings));
    // Process all Edges in answer after nodes
    bindingsMapEdges.forEach((val, keyId) => {
      if (this.qEdgeIdToIndMap.has(keyId)) { // This is an edge
        const qEdge = this.getQEdge(keyId);
        // Force kgEdgeIds in answer to always be a list of kgEdgeId(s)
        if (!isObservableArray(val)) {
          val = [val]; // eslint-disable-line no-param-reassign
        }
        let edgeObj = {};
        if ((qNodeIdsToSquash.indexOf(qEdge.source_id) !== -1) || (qNodeIdsToSquash.indexOf(qEdge.target_id) !== -1)) {
          // This edge should be squashed. Need to examine underlying source/target ids at kgNodeId
          // level since bi-directional answers possible so source/target from question_graph may not
          // map with directionality of the edges in the answers
          const firstEdge = this.getKgEdge(val[0]); // Only need to examine one of the edges in the group
          edgeObj = {
            id: qEdge.id,
            source_id: squashedKgNodeIdToQnodeId.has(firstEdge.source_id) ? squashedKgNodeIdToQnodeId.get(firstEdge.source_id) : firstEdge.source_id,
            target_id: squashedKgNodeIdToQnodeId.has(firstEdge.target_id) ? squashedKgNodeIdToQnodeId.get(firstEdge.target_id) : firstEdge.target_id,
            isSquashed: true,
            unsquashedEdges: val.map(kgEdgeId => this.getKgEdge(kgEdgeId)),
          };
          // Copy type specified in question (if specified) for squashed edge
          if (Object.prototype.hasOwnProperty.call(qEdge, 'type')) {
            edgeObj.type = qEdge.type;
          }
        } else {
          // Process all the edges (no squashing required)
          edgeObj = val.map(kgEdgeId => this.getKgEdge(kgEdgeId));
        }
        // Update edge_list in the graph datastructure
        if (!isObservableArray(edgeObj) && !Array.isArray(edgeObj)) {
          edgeObj = [edgeObj];
        }
        edgeObj.forEach(eObj => graph.edge_list.push(_.cloneDeep(toJS(eObj))));
      }
    });
    return toJS(graph);
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

  @action updateMessage(newMessage) {
    this.message = newMessage;
  }
}

export default AnswersetStore;
