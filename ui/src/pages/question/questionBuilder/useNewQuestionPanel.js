import { useState } from 'react';
import _ from 'lodash';

import useNode from './useNode';
import useEdge from './useEdge';

const initialQueryGraph = {
  nodes: [],
  edges: [],
};

export default function useNewQuestionPanel() {
  const [name, setName] = useState('');
  const [query_graph, updateQueryGraph] = useState(initialQueryGraph);
  const [showPanel, togglePanel] = useState(false);
  const [panelType, setPanelType] = useState(null);
  const [activePanelId, updateActivePanelId] = useState(null);
  const node = useNode();
  const edge = useEdge();

  /**
   * Load a copy of the query graph to be modified for new question
   * @param {object} qGraph query graph. Will make a copy and modify said copy.
   */
  function load(qGraph) {
    updateQueryGraph(_.cloneDeep(qGraph));
  }

  /**
   * Open a node/edpe panel either fresh or with a seed id
   * @param {string} type either node or edge
   * @param {string} id unique id of node or edge. i.e. n0, n1, e0...
   */
  function openPanel(type, id) {
    setPanelType(type);
    if (type === 'node') {
      if (id) { // load node from query graph
        const nodeSeed = query_graph.nodes.find((n) => n.id === id);
        setName(id);
        node.initialize(nodeSeed);
      } else { // new node
        node.reset();
        setName(`n${query_graph.nodes.length}`);
      }
    } else if (id) { // load edge from query graph
      const edgeSeed = query_graph.edges.find((e) => e.id === id);
      setName(id);
      edge.initialize(edgeSeed);
    } else { // new edge
      edge.reset();
      setName(`e${query_graph.edges.length}`);
    }
    // we need active id for node/edge removal
    updateActivePanelId(id);
    togglePanel(true);
  }

  /**
   * Remove deleted nodes that have no connected edges
   * @param {object} q_graph deep copy of the query_graph, modifies and returns
   */
  function trimFloatingNodes(q_graph) {
    const nodeIds = new Set();
    q_graph.edges.forEach((e) => {
      if (!e.deleted) {
        nodeIds.add(e.source_id);
        nodeIds.add(e.target_id);
      }
    });
    q_graph.nodes = q_graph.nodes.filter((n) => nodeIds.has(n.id));
    return q_graph;
  }

  /**
   * Remove current node by active id
   */
  function removeNode() {
    const q_graph = _.cloneDeep(query_graph);
    const activeInd = q_graph.nodes.findIndex((n) => n.id === activePanelId);
    q_graph.nodes[activeInd].deleted = true;
    const trimmedQueryGraph = trimFloatingNodes(q_graph);
    updateQueryGraph(trimmedQueryGraph);
  }

  return {
    showPanel,
    panelType,
    name,
    query_graph,
    node,
    edge,
    activePanelId,
    load,
    togglePanel,
    setPanelType,
    openPanel,
    removeNode,
  };
}
