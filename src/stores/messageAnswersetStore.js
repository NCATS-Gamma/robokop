import { observable, action, computed, configure, runInAction, isObservableArray, toJS } from 'mobx';
// import Fuse from 'fuse-js-latest';

import entityNameDisplay from '../components/util/entityNameDisplay';
// import { boolean } from 'mobx-state-tree/dist/internal';
// import AppConfig from '../AppConfig';

// const config = require('../../config.json');
const _ = require('lodash');
const hash = require('object-hash');


configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

class AnswersetStore {
  @observable message = {}; // Message object supplied to store on init
  @observable activeAnswerId = null; // Currently 'selected' answer
  @observable filteredAnswers = []; // array of filtered answers
  @observable filterHash = ''; // hash of filtered answers object for checking if we need to get available answers
  @observable numKGNodes = 35 // Number of nodes (approx) for pruned annotated KG. Null results in all nodes

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
      //       const knodeId = a.node_bindings[qnodeId];
      //       this.message.nodes.some(n => n.id === knodeId);
      //       return boolean(node)
      //     }
      //   })
      this.activeAnswerId = this.message.answers[0].id;
    });
  }

  // Return number of question nodes in message
  @computed get numQNodes() {
    return this.message.question_graph ? this.message.question_graph.nodes.length : 0;
  }

  // Return number of KG nodes in message
  @computed get maxNumKGNodes() {
    return this.message.knowledge_graph ? this.message.knowledge_graph.nodes.length : 0;
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
  getGraphNode(graph, nodeId) {
    return graph.nodes.find(n => n.id === nodeId);
  }
  getGraphEdge(graph, edgeId) {
    return graph.edges.find(e => e.id === edgeId);
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
    const graph = this.annotatedKnowledgeGraph;
    const answers = [];
    this.message.answers.forEach((ans) => {
      const ansObj = {
        score: ans.score, nodes: {}, edges: {}, id: ans.id,
      };
      qNodeIds.forEach((qNodeId) => {
        const qNode = this.getQNode(qNodeId);
        let nodeListObj = { type: qNode.type, isSet: false };
        const cNodes = toJS(ans.node_bindings[qNodeId]);
        if (!Array.isArray(cNodes)) {
          // This is not a set node
          if (('set' in qNode) && qNode.set) {
            // Actually a set but only has one element
            nodeListObj = { type: qNode.type, name: `Set: ${entityNameDisplay(qNode.type)}`, isSet: true };
            nodeListObj.setNodes = [cNodes].map(kgNodeId => toJS(this.getGraphNode(graph, kgNodeId)));
          } else {
            // for real, not a set
            nodeListObj = { ...nodeListObj, ...toJS(this.getGraphNode(graph, ans.node_bindings[qNodeId])) };
          }
        } else if ((ans.node_bindings[qNodeId].length === 1) && ('set' in qNode) && !qNode.set) {
          // This is not a set node but, for some reason is an array

          nodeListObj = { ...nodeListObj, ...toJS(this.getGraphNode(graph, ans.node_bindings[qNodeId][0])) };
        } else {
          // Set
          nodeListObj = { type: qNode.type, name: `Set: ${entityNameDisplay(qNode.type)}`, isSet: true };
          nodeListObj.setNodes = ans.node_bindings[qNodeId].map(kgNodeId => toJS(this.getGraphNode(graph, kgNodeId)));
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
        ansObj.edges[qEdgeId] = cEdgeIds.map(eid => toJS(this.getGraphEdge(graph, eid)));
      });

      answers.push(ansObj);
    });
    return toJS({ answers, headerInfo });
  }

  @computed get annotatedKnowledgeGraph() {
    // KG nodes don't always have type
    // If they don't we need to figure out which qNodes they most like correspond to
    // Then check labels and use the corresponding type

    let graph = this.message.knowledge_graph;

    if (this.message.question_graph) {
      const qNodes = this.message.question_graph.nodes;
      const qNodeBindings = qNodes.map(q => q.id);

      graph = toJS(graph);

      graph.nodes.forEach((n) => {
        if ((('type' in n) && Array.isArray(n.type)) || (!('type' in n) && ('labels' in n))) {
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

  // Determines if annotatedPrunedKnowledgeGraph had to prune KG
  isKgPruned() {
    if (this.message.knowledge_graph) {
      return this.maxNumKGNodes > this.numKGNodes;
    }
    return false;
  }

  @computed get annotatedPrunedKnowledgeGraph() {
    if (this.message.question_graph) {
      // KG nodes don't always have type
      // If they don't we need to figure out which qNodes they most like correspond to
      // Then check labels and use the corresponding type

      let graph = this.message.knowledge_graph;
      const { answers } = toJS(this.message);
      const N = this.numKGNodes;
      const Q = this.numQNodes;
      const Nj = Math.round(N / Q);

      const makeEmptyArray = (len, init) => {
        const array = new Array(len);
        for (let i = 0; i < len; i += 1) array[i] = init;
        return array;
      };

      // Create a map between qGraph nodeId to index (for scoreVector) and vice-versa
      const qGraphNodeIdToIndMap = {};
      const qGraphNodeIndToNodeIdMap = {};
      this.message.question_graph.nodes.forEach((n, i) => {
        qGraphNodeIdToIndMap[n.id] = i;
        qGraphNodeIndToNodeIdMap[i] = n.id;
      });

      // Object map mapping qNodeId to Array of Objects of score info
      // of format { scoreVector, aggScore, kGNodeId }
      // eg: {"node01": [{ scoreVector, aggScore, id }, ...], "node02": [{ scoreVector, aggScore, id }, ...]}
      const qGraphNodeIdToScoreObjArrMap = {};
      Object.keys(qGraphNodeIdToIndMap).forEach(qNodeId => (qGraphNodeIdToScoreObjArrMap[qNodeId] = []));

      // Maps kgNodeId eg: "HGNC:6251" to it's index in message.knowledge_graph.nodes list
      const kgNodeIdToKgNodeIndMap = {};

      graph = toJS(graph);
      // Iterate through each node in knowledgeGraph and score them
      graph.nodes.forEach((n, i) => {
        kgNodeIdToKgNodeIndMap[n.id] = i; // Store map of kGNodeId to kGNodeInd
        n.scoreVector = makeEmptyArray(Q, 0);
        // Iterate through each answer
        answers.forEach((ans) => {
          const { node_bindings } = ans;
          // Iterate through each node_binding in an answer and if the KG node matches any, update score
          Object.keys(node_bindings).forEach((node_binding) => {
            let isMatch = false;
            if (Array.isArray(node_bindings[node_binding])) {
              if (node_bindings[node_binding].indexOf(n.id) > -1) {
                isMatch = true;
              }
            } else {
              if (node_bindings[node_binding] === n.id) { // eslint-disable-line no-lonely-if
                isMatch = true;
              }
            }
            // Update score for qNode position in scoreVector since this kGNode was
            // referenced in this answer
            if (isMatch) {
              n.scoreVector[qGraphNodeIdToIndMap[node_binding]] += ans.score;
            }
          });
        });
        n.aggScore = n.scoreVector.reduce((a, b) => a + b, 0);
        // Update qGraphNodeIdToScoreObjArrMap with this node for any non-zero
        // qNodeScore (Meaning that this node was referenced one or more times by
        // the corresponding qNode for qNodeInd)
        n.scoreVector.forEach((qNodeScore, qNodeInd) => {
          if (qNodeScore > 0) {
            qGraphNodeIdToScoreObjArrMap[qGraphNodeIndToNodeIdMap[qNodeInd]].push({
              scoreVector: n.scoreVector, aggScore: n.aggScore, id: n.id,
            });
          }
        });
      });

      // Now sort for each qNode, by aggScore and retain a max of Nj nodes for each qNodeId
      let extraNumNodes = 0; // Increment if any qNodeId utilizes less than Nj nodes
      const selectedNodeIdSet = new Set(); // Set containing all selected nodes across all qNodes
      let unselectedScoreObjArrMap = []; // Array of { scoreVector, aggScore, kGNodeId } objects that were not selected
      Object.keys(qGraphNodeIdToScoreObjArrMap).forEach((qGraphNodeId) => {
        qGraphNodeIdToScoreObjArrMap[qGraphNodeId] = _.uniqBy(qGraphNodeIdToScoreObjArrMap[qGraphNodeId], el => el.id); // Remove dup nodes
        qGraphNodeIdToScoreObjArrMap[qGraphNodeId] = _.reverse(_.sortBy(qGraphNodeIdToScoreObjArrMap[qGraphNodeId], el => el.aggScore));
        const numQGraphNodes = qGraphNodeIdToScoreObjArrMap[qGraphNodeId].length;
        if (numQGraphNodes < Nj) {
          extraNumNodes += Nj - numQGraphNodes;
        } else {
          unselectedScoreObjArrMap = unselectedScoreObjArrMap.concat(qGraphNodeIdToScoreObjArrMap[qGraphNodeId].slice(Nj));
          qGraphNodeIdToScoreObjArrMap[qGraphNodeId] = qGraphNodeIdToScoreObjArrMap[qGraphNodeId].slice(0, Nj);
        }
        // Add all the nodeIds for pruned nodes for this qNodeId to set of selected nodeIds
        qGraphNodeIdToScoreObjArrMap[qGraphNodeId].forEach(el => selectedNodeIdSet.add(el.id));
      });

      // Construct list of all nodeIds for final pruned knowledgeGraph
      let prunedKGNodeIds = [];
      Object.keys(qGraphNodeIdToScoreObjArrMap).forEach((qGraphNodeId) => {
        qGraphNodeIdToScoreObjArrMap[qGraphNodeId].forEach(scoreObj => prunedKGNodeIds.push(scoreObj.id));
      });
      const numExtraNodesToGrab = N - prunedKGNodeIds.length;
      // If extraNodes available to be populated, sort unselectedScoreObjArrMap and
      // pick max remaining nodes to pick and add their ids to selectedNodeIdSet
      // TODO: This step can result in all extra nodes from a single qNode that has high AggScore (eg node6 in message_test.json)
      if (numExtraNodesToGrab > 0) {
        unselectedScoreObjArrMap = _.uniqBy(unselectedScoreObjArrMap, el => el.id);
        unselectedScoreObjArrMap = _.reverse(_.sortBy(unselectedScoreObjArrMap, el => el.aggScore));
        prunedKGNodeIds = prunedKGNodeIds.concat(unselectedScoreObjArrMap.slice(0, numExtraNodesToGrab).map(el => el.id));
      }

      // Construct prunedKgNodeList
      const prunedKgNodeList = prunedKGNodeIds.map(kgNodeId => graph.nodes[kgNodeIdToKgNodeIndMap[kgNodeId]]);
      const prunedKgNodeIdSet = new Set(prunedKgNodeList.map(n => n.id));
      // Construct pruned edges from original KG-graph
      const prunedKgEdgeList = graph.edges.filter((e) => {
        if (prunedKgNodeIdSet.has(e.source_id) && prunedKgNodeIdSet.has(e.target_id)) {
          return true;
        }
        return false;
      });

      const prunedGraph = {
        nodes: prunedKgNodeList,
        edges: prunedKgEdgeList,
      };

      // Now set correct type for nodes by going through answers and
      // allowing for majority vote across all answers for the type
      const qNodes = this.message.question_graph.nodes;
      const qNodeBindings = qNodes.map(q => q.id);

      prunedGraph.nodes.forEach((n) => {
        if ((('type' in n) && Array.isArray(n.type)) || (!('type' in n) && ('labels' in n))) {
          // if a prunedGraph node doesn't have a type
          // We will look through all answers
          // We will count the number of times is used in each qNode
          // Then take the max to pick the best one
          // The type is then the type of that qNode
          const qNodeCounts = qNodeBindings.map(() => 0);

          answers.forEach((a) => {
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
      // }

      return toJS(prunedGraph);
    }
    return {};
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
    this.filterHash = hash(filteredAnswers);
  }

  @action resetNumKGNodes() {
    this.numKGNodes = null;
  }

  @action updateNumKGNodes(value) {
    this.numKGNodes = value;
  }
}

export default AnswersetStore;
