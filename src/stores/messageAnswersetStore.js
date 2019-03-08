import { observable, action, computed, configure, runInAction, isObservableArray, toJS } from 'mobx';
// import Fuse from 'fuse-js-latest';

import entityNameDisplay from '../components/util/entityNameDisplay';
import { filter } from 'graphql-anywhere';
// import { boolean } from 'mobx-state-tree/dist/internal';
// import AppConfig from '../AppConfig';

// const config = require('../../config.json');
const _ = require('lodash');


configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

class AnswersetStore {
  @observable message = {}; // Message object supplied to store on init
  @observable activeAnswerId = null; // Currently 'selected' answer
  @observable filteredAnswers = []; // array of filtered answers

  constructor(message) {
    runInAction(() => {
      this.message = message;
      // Assign id to each answer if not present in supplied message
      this.message.answers.forEach((a, i) => {
        if (!a.id) {
          a.id = i; // eslint-disable-line no-param-reassign
        }
      });
      // this.message.answers.filter((a) => {
      //   for (qnodeId in a.node_bindings) {
      //     const knodeId = a.node_bindings[qnodeId];
      //     this.message.nodes.some(n => n.id === knodeId);
      //     return boolean(node)
      //   }
      // })
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
          // if a graph node doesn't have a type
          // We will look through all answers
          // We will count the number of times is used in each qNode
          // Then take the max to pick the best one
          // The type is then the type of that qNode
          const qNodeCounts = qNodeBindings.map(() => 0);

          this.message.answers.forEach((a) => {
            // Go through answers and look for this node
            Object.keys(a.node_bindings).forEach((key) => {
              const theseIds = toJS(a.node_bindings[key]);
              if (Array.isArray(theseIds)) {
                // This answer has a set of nodes for this binding
                if (theseIds.includes(n.id)) {
                  // The set contains this id
                  qNodeCounts[qNodeBindings.indexOf(key)] += 1;
                }
              } else if (theseIds === n.id) {
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

    // We could loop through the qNodes to find out what nodes are in this answer
    // But there might be extra nodes or edges in this answer
    // This happens with literature edges, they aren't in qgraph but they are in answers
    const nodeBindingsMap = new Map(Object.entries(answer.node_bindings));
    // So we loop through the keys in node_bindings
    nodeBindingsMap.forEach((val, keyId) => {
      const newNodes = [];
      const qNode = this.getQNode(keyId);
      let nodeIds = toJS(val);
      let isSet = true;
      if (!Array.isArray(nodeIds)) {
        nodeIds = [nodeIds];
        isSet = false;
        // Node is not a set
        // We will make it an array so we can follow the same code path
      }
      nodeIds.forEach((nodeId) => {
        const kgNode = toJS(this.getKgNode(nodeId));
        // Get the type from the qNode
        if (kgNode) {
          kgNode.type = qNode.type;
          kgNode.isSet = isSet;
          kgNode.binding = keyId;
          newNodes.push(kgNode);
        }
      });
      newNodes.forEach(n => graph.node_list.push(_.cloneDeep(n)));
    });

    const edgeBindingsMap = new Map(Object.entries(answer.edge_bindings));
    // So we loop through the keys in node_bindings
    edgeBindingsMap.forEach((val, keyId) => {
      const newEdges = [];
      let edgeIds = toJS(val);
      if (!Array.isArray(edgeIds)) {
        edgeIds = [edgeIds];
        // Edge is not an array
        // We will make it an array so we can follow the same code path
      }
      edgeIds.forEach((edgeId) => {
        const kgEdge = toJS(this.getKgEdge(edgeId));
        // Get the type from the qNode
        if (kgEdge) {
          kgEdge.binding = keyId;
          newEdges.push(kgEdge);
        }
      });
      newEdges.forEach(e => graph.edge_list.push(_.cloneDeep(e)));
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

  @action updateMessage(newMessage) {
    this.message = newMessage;
  }

  @action updateFilteredAnswers(filteredAnswers) {
    this.filteredAnswers = filteredAnswers;
  }
}

export default AnswersetStore;
