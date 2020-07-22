import { observable, action, computed, configure, runInAction, isObservableArray, toJS } from 'mobx';
// import Fuse from 'fuse-js-latest';

import entityNameDisplay from '../components/util/entityNameDisplay';
// import { boolean } from 'mobx-state-tree/dist/internal';
// import AppConfig from '../AppConfig';

// const config = require('../../config.json');
const _ = require('lodash');

configure({ enforceActions: 'always' }); // Prevent observable mutations in MobX outside of actions

class AnswersetStore {
  @observable message = {}; // Message object supplied to store on init
  @observable activeAnswerId = null; // Currently 'selected' answer
  @observable denseAnswer = {};
  @observable filter = {};
  @observable filterKeys = {};
  @observable searchedFilter = {};
  @observable filteredAnswers = []; // array of filtered answers
  @observable filterHash = ''; // hash of filtered answers object for checking if we need to get available answers
  @observable numKGNodes = 35; // Number of nodes (approx) for pruned annotated KG. Null results in all nodes
  @observable numAgSetNodes = 10; // Number of nodes for pruned active answer graph
  @observable kgNodeIdToIndMap = new Map();

  // we don't want to include any of these in the filter
  keyBlacklist = ['isSet', 'labels', 'equivalent_identifiers', 'type', 'id', 'degree'];
  unknownNodes = false;

  constructor(message) {
    runInAction(() => {
      console.log('got the message');
      this.message = message;
      console.log('stored the message');
      // Assign id to each answer if not present in supplied message
      this.message.answers.forEach((a, i) => {
        if (!a.id) {
          a.id = i; // eslint-disable-line no-param-reassign
        }
      });
      this.activeAnswerId = this.message.answers[0].id;
      if (this.message.knowledge_graph) {
        this.message.knowledge_graph.nodes.forEach((n, i) => this.kgNodeIdToIndMap.set(n.id, i));
      }
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
  getQNodeIds() {
    const qNodeIds = [];
    this.message.question_graph.nodes.forEach((n) => {
      qNodeIds.push(n.id);
    });
    return qNodeIds;
  }
  getQEdgeIds() {
    const qEdgeIds = [];
    this.message.question_graph.edges.forEach((e) => {
      qEdgeIds.push(e.id);
    });
    return qEdgeIds;
  }
  getKNodeIds() {
    const kNodeIds = [];
    this.message.knowledge_graph.nodes.forEach((n) => {
      kNodeIds.push(n.id);
    });
    return kNodeIds;
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
  //   columnHeaders: [{ Header: 'n01: Gene', id: 'n01', isSet: false, type: 'gene'}, {}, ...],
  // }
  @computed get answerSetTableData() {
    const columnHeaders = [];
    const answers = [];
    // set the column headers object
    this.message.question_graph.nodes.forEach((n) => {
      columnHeaders.push({
        Header: `${n.id}: ${entityNameDisplay(n.type)}`,
        id: n.id,
        isSet: n.set,
        type: n.type,
      });
    });
    // get the names and score from each answer for the table
    this.message.answers.forEach((ans) => {
      const nodeBindings = ans.node_bindings;
      const answer = {};
      Object.keys(nodeBindings).forEach((qnodeId) => {
        let kNodeIds = nodeBindings[qnodeId];
        if (!isObservableArray(kNodeIds)) {
          kNodeIds = [kNodeIds];
        }
        answer[qnodeId] = [];
        kNodeIds.forEach((kNodeId) => {
          const kNode = this.getKgNode(kNodeId);
          if (kNode) {
            answer[qnodeId].push({
              name: kNode.name,
              id: kNode.id,
            });
          } else {
            answer[qnodeId].push({
              name: 'Missing Node',
            });
            this.unknownNodes = true;
          }
        });
      });
      answer.score = ans.score;
      answer.id = ans.id;
      answers.push(answer);
    });
    return toJS({ columnHeaders, answers });
  }

  @action getAlphaTable(concepts) {
    const columnHeaders = [];
    const answers = [];
    const colHeaders = ['name', 'id', 'type'];
    colHeaders.forEach((header) => {
      columnHeaders.push({
        Header: entityNameDisplay(header),
        id: header,
      });
    });
    // get the names and score from each answer for the table
    this.message.answers.forEach((ans) => {
      const nodeBindings = ans.node_bindings;
      const answer = {};
      Object.keys(nodeBindings).forEach((qnodeId) => {
        let kNodeIds = nodeBindings[qnodeId];
        if (!isObservableArray(kNodeIds)) {
          kNodeIds = [kNodeIds];
        }
        answer[qnodeId] = [];
        kNodeIds.forEach((kNodeId) => {
          const kNode = this.getKgNode(kNodeId);
          if (kNode) {
            const type = concepts.find(concept => concept !== 'named_thing' && kNode.type.includes(concept));
            answer[qnodeId].push({
              name: kNode.name,
              id: kNode.id,
              type,
              color: type,
            });
          } else {
            answer[qnodeId].push({
              name: 'Missing Node',
            });
            this.unknownNodes = true;
          }
        });
      });
      answer.score = ans.score;
      answer.id = ans.id;
      answers.push(answer);
    });
    return toJS({ columnHeaders, answers });
  }

  @action getSetNodes(answerId, nodeId) {
    const setNodeIds = this.message.answers[answerId].node_bindings[nodeId];
    const setNodes = setNodeIds.map(id => this.getKgNode(id));
    return toJS(setNodes);
  }

  // builds dense answer
  @action getDenseAnswer(answerId) {
    const qNodeIds = this.getQNodeIds();
    const qEdgeIds = this.getQEdgeIds();
    const kg = this.message.knowledge_graph;
    const kgEdgeMap = this.kgEdgeIdToIndMap;
    const answer = this.message.answers[answerId];
    const ansObj = {
      score: answer.score, nodes: {}, edges: {}, id: answer.id,
    };
    qNodeIds.forEach((qNodeId) => {
      const qNode = this.getQNode(qNodeId);
      let nodeListObj = { type: qNode.type, isSet: false };
      const knodeIds = answer.node_bindings[qNodeId];
      if (!isObservableArray(knodeIds)) {
        // This is not a set node
        if (('set' in qNode) && qNode.set) {
          // Actually a set but only has one element
          nodeListObj = { type: qNode.type, name: `Set: ${entityNameDisplay(qNode.type)}`, isSet: true };
          nodeListObj.setNodes = [knodeIds].map(kgNodeId => toJS(this.getKgNode(kgNodeId)));
        } else {
          // for real, not a set
          nodeListObj = { ...toJS(this.getKgNode(knodeIds)), ...nodeListObj };
        }
      } else if ((knodeIds.length === 1) && ('set' in qNode) && !qNode.set) {
        // This is not a set node but, for some reason is an array

        nodeListObj = { ...toJS(this.getKgNode(knodeIds[0])), ...nodeListObj };
      } else {
        // Set
        nodeListObj = { type: qNode.type, name: `Set: ${entityNameDisplay(qNode.type)}`, isSet: true };
        nodeListObj.setNodes = knodeIds.map(kgNodeId => toJS(this.getKgNode(kgNodeId)));
      }
      ansObj.nodes[qNodeId] = nodeListObj;
    });
    qEdgeIds.forEach((qEdgeId) => {
      let cEdgeIds = [];
      if (!isObservableArray(answer.edge_bindings[qEdgeId])) { // Just a single id
        cEdgeIds = [answer.edge_bindings[qEdgeId]];
      } else { // we already have an array.
        cEdgeIds = answer.edge_bindings[qEdgeId];
      }
      ansObj.edges[qEdgeId] = cEdgeIds.map(eid => toJS(kg.edges[kgEdgeMap.get(eid)]));
    });

    return toJS(ansObj);
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
          // level is added to let the user display the graph hierarchically
          n.level = qNodeIndex;

          // Use that Q Nodes Type
          n.type = qNodes[qNodeIndex].type; // eslint-disable-line no-param-reassign
          if (n.type === 'named_thing') { // we don't actually want any named_things
            let kgNodeType = toJS(this.getKgNode(n.id).type);
            if (!Array.isArray(kgNodeType)) { // so the type will always be an array
              kgNodeType = [kgNodeType];
            }
            n.type = kgNodeType; // eslint-disable-line no-param-reassign
          }
        }
      });

      return toJS(prunedGraph);
    }
    return {};
  }

  @action isAgPruned() {
    return this.numAgSetNodes < this.maxNumAgNodes;
  }

  @computed get maxNumAgNodes() {
    const answer = this.message.answers[this.ansIdToIndMap.get(this.activeAnswerId)];
    const nodeBindingsMap = new Map(Object.entries(answer.node_bindings));
    let maxNumAgNodes = 0;
    nodeBindingsMap.forEach((val) => {
      const nodeIds = toJS(val);
      if (Array.isArray(nodeIds)) {
        maxNumAgNodes = Math.max(maxNumAgNodes, nodeIds.length);
      }
    });
    return maxNumAgNodes;
  }

  // Returns subgraphViewer compatible format graph spec { nodes: {}, edges: {} }
  @computed get activeAnswerGraph() {
    const answer = this.message.answers[this.ansIdToIndMap.get(this.activeAnswerId)];
    const graph = { nodes: [], edges: [] };

    // We could loop through the qNodes to find out what nodes are in this answer
    // But there might be extra nodes or edges in this answer
    // This happens with literature edges, they aren't in qgraph but they are in answers
    const nodeBindingsMap = new Map(Object.entries(answer.node_bindings));
    // So we loop through the keys in node_bindings
    nodeBindingsMap.forEach((val, keyId) => {
      const newNodes = [];
      const qNode = this.getQNode(keyId);
      const nodeIds = toJS(val);
      let nodes = [];
      let isSet = true;

      if (!qNode.set) {
        // if the node is not a set but is still an array
        const nodeId = Array.isArray(nodeIds) ? nodeIds[0] : nodeIds;
        nodes = [{ id: nodeId }];
        isSet = false;
        // Node is not a set
        // We will make it an array so we can follow the same code path
      } else { // we need to prune the set nodes down to a managable number
        nodeIds.forEach((nodeId) => {
          const node = { id: nodeId };
          let score = 0;
          this.message.knowledge_graph.edges.forEach((edge) => {
            if (nodeId === edge.source_id || nodeId === edge.target_id) {
              if ('publications' in edge) {
                score += edge.publications.length;
              }
            }
          });
          node.score = score;
          nodes.push(node);
        });
        nodes = _.reverse(_.sortBy(nodes, n => n.score));
        nodes = nodes.splice(0, this.numAgSetNodes);
      }
      nodes.forEach((node) => {
        const kgNode = toJS(this.getKgNode(node.id));
        // Get the type from the qNode
        if (kgNode) {
          kgNode.type = qNode.type;
          kgNode.isSet = isSet;
          kgNode.binding = keyId;
          // level is needed for hierarchical view
          kgNode.level = this.qNodeIdToIndMap.get(keyId);
          newNodes.push(kgNode);
        }
      });
      newNodes.forEach(n => graph.nodes.push(_.cloneDeep(n)));
    });

    const prunedAgNodeIdSet = new Set(graph.nodes.map((n => n.id)));

    const edgeBindingsMap = new Map(Object.entries(answer.edge_bindings));

    // Construct pruned edges
    edgeBindingsMap.forEach((kedgeIds, qedgeId) => {
      const newEdges = [];
      let edgeIds = toJS(kedgeIds);
      if (!Array.isArray(edgeIds)) {
        edgeIds = [edgeIds];
      }
      edgeIds.forEach((eId) => {
        // get kedge details
        const kgEdge = toJS(this.getKgEdge(eId));
        // check that kedge is not pruned away
        if (kgEdge && prunedAgNodeIdSet.has(kgEdge.source_id) && prunedAgNodeIdSet.has(kgEdge.target_id)) {
          kgEdge.binding = qedgeId;
          // add to newEdges
          newEdges.push(kgEdge);
        }
      });
      newEdges.forEach(e => graph.edges.push(_.cloneDeep(e)));
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

  @action resetNumKGNodes() {
    this.numKGNodes = null;
  }

  @action updateNumKGNodes(value) {
    this.numKGNodes = value;
  }

  @action updateNumAgNodes(value) {
    this.numAgSetNodes = value;
  }

  @action initializeFilter() {
    // makes simple filter object
    // {
    //  n0:{
    //    MONDO:0005737: true
    //  },
    //  n1: {
    //    LINS1: true
    //  }
    // }
    const { filter, message } = this;
    const qNodeIds = this.getQNodeIds();
    qNodeIds.forEach((id) => {
      filter[id] = {};
    });
    message.answers.forEach((ans) => {
      const nodeBindings = ans.node_bindings;
      qNodeIds.forEach((id) => {
        if (isObservableArray(nodeBindings[id])) {
          nodeBindings[id].forEach((kNodeId) => {
            filter[id][kNodeId] = true;
          });
        } else {
          filter[id][nodeBindings[id]] = true;
        }
      });
    });
    this.filter = filter;
    this.initializeFilterKeys();
  }

  // get only keys that show up in every single answer
  initializeFilterKeys() {
    // makes nested filter keys object
    // {
    //  n0: {
    //    name: {
    //      Ebola: [true, true]
    //    }
    //  },
    //  n1: {
    //    name: {
    //      LINS1: [true, true]
    //    }
    //  }
    // }
    // the arrays are [checked, available given other columns]
    const { question_graph: qg } = this.message;
    const { filter } = this;
    const filterKeys = {};
    qg.nodes.forEach((qnode) => {
      const qnodeId = qnode.id;
      filterKeys[qnodeId] = {};
      const qnodeFilter = filterKeys[qnodeId];
      Object.keys(filter[qnodeId]).forEach((knodeId) => {
        const knode = this.getKgNode(knodeId);
        if (knode) {
          if (Object.keys(qnodeFilter).length === 0) {
            // we are dealing with the first node
            Object.keys(knode).forEach((propertyKey) => {
              propertyKey = propertyKey.replace(/ /g, '_'); // for consistency, change all spaces to underscores
              if (!this.keyBlacklist.includes(propertyKey)) {
                qnodeFilter[propertyKey] = {};
                qnodeFilter[propertyKey][knode[propertyKey]] = [true, true];
              }
            });
          } else {
            // we are adding a node to the existing filterKeys
            Object.keys(knode).forEach((propertyKey) => {
              propertyKey = propertyKey.replace(/ /g, '_'); // for consistency, change all spaces to underscores
              if (!this.keyBlacklist.includes(propertyKey) && qnodeFilter[propertyKey]) {
                qnodeFilter[propertyKey][knode[propertyKey]] = [true, true];
              }
            });
          }
          Object.keys(qnodeFilter).forEach((propertyKey) => {
            if (!Object.keys(knode).includes(propertyKey)) {
              delete qnodeFilter[propertyKey];
            }
          });
        }
      });
    });
    this.filterKeys = filterKeys;
    this.searchedFilter = filterKeys;
  }

  // given a value and nodeId, either check or uncheck it
  @action updateFilterKeys(qnodeId, propertyKey, propertyValue) {
    const oldValue = this.filterKeys[qnodeId][propertyKey][propertyValue][0];
    this.filterKeys[qnodeId][propertyKey][propertyValue][0] = !oldValue;
    this.updateFilter();
  }

  // update filter object given the filterKeys object
  @action updateFilter() {
    const { filter, message } = this;
    const qNodeIds = this.getQNodeIds();
    message.answers.forEach((ans) => {
      const nodeBindings = ans.node_bindings;
      qNodeIds.forEach((qnodeId) => {
        let knodeIds = nodeBindings[qnodeId];
        if (!isObservableArray(knodeIds)) {
          knodeIds = [knodeIds];
        }
        const qnodeFilter = this.filterKeys[qnodeId];
        let show;
        knodeIds.forEach((knodeId) => {
          const knode = this.getKgNode(knodeId);
          if (knode) {
            show = !Object.keys(qnodeFilter).some(propertyKey => !qnodeFilter[propertyKey][knode[propertyKey]][0]);
            filter[qnodeId][knodeId] = show;
          }
        });
      });
    });
  }

  @action searchFilter(qnodeId, value) {
    const { filterKeys } = this;
    // we need to make a complete copy of filterKeys
    const searchedFilter = _.cloneDeep(filterKeys);
    Object.keys(filterKeys[qnodeId]).forEach((propertyKey) => {
      Object.keys(filterKeys[qnodeId][propertyKey]).forEach((propertyValue) => {
        // if the property value doesn't include the search term, delete it from the searched filter
        if (!propertyValue.toLowerCase().includes(value.toLowerCase())) {
          delete searchedFilter[qnodeId][propertyKey][propertyValue];
        }
      });
    });
    this.searchedFilter = searchedFilter;
  }

  // reset the filter and filterKeys objects back to all trues
  @action reset(qnodeId) {
    const { filterKeys } = this;
    Object.keys(filterKeys[qnodeId]).forEach((propertyKey) => {
      Object.keys(filterKeys[qnodeId][propertyKey]).forEach((propertyValue) => {
        filterKeys[qnodeId][propertyKey][propertyValue][0] = true;
      });
    });
    this.searchedFilter = _.cloneDeep(filterKeys);
    this.updateFilter();
  }

  // check whether any properties are checked and either check or uncheck all
  @action checkAll(qnodeId, propertyKey) {
    const { filterKeys } = this;
    const check = this.isPropFiltered(filterKeys[qnodeId][propertyKey]);
    Object.keys(filterKeys[qnodeId][propertyKey]).forEach((propertyValue) => {
      filterKeys[qnodeId][propertyKey][propertyValue][0] = check;
    });
    this.updateFilter();
  }

  // return boolean of if any properties are checked
  @action isPropFiltered(propertyKey) {
    let filtered = false;
    filtered = Object.keys(propertyKey).some(propertyValue => !propertyKey[propertyValue][0]);
    return filtered;
  }

  // update react table based on filter object
  @action defaultFilter(row) {
    const { filter } = this;
    let show = true;
    const qnodeIds = this.getQNodeIds();
    qnodeIds.forEach((qnodeId) => {
      row._original[qnodeId].forEach((knode) => {
        if (knode.id && !filter[qnodeId][knode.id]) {
          show = false;
          return show;
        }
      });
    });
    return show;
  }

  // check to see if whole column filter has any false values
  @action isFiltered(qnodeId) {
    const { filterKeys } = this;
    let filtered = false;
    if (filterKeys[qnodeId]) {
      // goes through the filterkeys until it finds one that is false
      filtered = Object.keys(filterKeys[qnodeId]).some(propertyKey =>
        Object.keys(filterKeys[qnodeId][propertyKey]).some(propertyValue =>
          !filterKeys[qnodeId][propertyKey][propertyValue][0]));
    }
    return filtered;
  }

  // update filterKeys object based on filter and table filtered answers
  @action updateFilteredAnswers(filteredAnswers) {
    this.filteredAnswers = filteredAnswers;
    const { question_graph: qg } = this.message;
    const { filter, filterKeys } = this;
    qg.nodes.forEach((qnode) => {
      const qnodeId = qnode.id;
      const qnodeFilter = filterKeys[qnodeId];
      Object.keys(qnodeFilter).forEach((propertyKey) => {
        Object.keys(qnodeFilter[propertyKey]).forEach((propertyValue) => {
          qnodeFilter[propertyKey][propertyValue][1] = false;
        });
      });
    });

    this.filteredAnswers.forEach((answer) => { // loop over rows (remaining answers)
      this.getQNodeIds().forEach((qnodeId) => { // loop over columns (qnodes)
        answer._original[qnodeId].forEach((knode) => { // loop over knodes
          if (filter[qnodeId][knode.id]) {
            knode = this.getKgNode(knode.id);
            Object.keys(knode).forEach((propertyKey) => { // loop over properties belonging to knode
              propertyKey = propertyKey.replace(/ /g, '_'); // for consistency, change all spaces to underscores
              if (propertyKey in filterKeys[qnodeId]) {
                filterKeys[qnodeId][propertyKey][knode[propertyKey]][1] = true;
              }
            });
          }
        });
      });
    });
  }
}

export default AnswersetStore;
