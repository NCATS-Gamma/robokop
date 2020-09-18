import React, { useState, useEffect, useRef } from 'react';
import shortid from 'shortid';
import _ from 'lodash';

import CardTypes from '../../../utils/questionNewCardTypes';
import getNodeTypeColorMap from '../../../utils/colorUtils';
import entityNameDisplay from '../../../utils/entityNameDisplay';

import config from '../../../config.json';

const Graph = require('react-graph-vis').default;

// Default pre-processing method on each node object to return updated node obj
/* eslint-disable no-param-reassign */
function defaultNodePreProc(n) {
  n.isSet = ('set' in n) && (((typeof n.set === typeof true) && n.set) || ((typeof n.set === 'string') && n.set === 'true'));
  n.chosen = false; // Not needed since borderWidth manually set below
  n.borderWidth = 1;
  if (n.isSet) {
    n.shadow = {
      enabled: true,
      size: 10,
      color: 'rgba(0,0,0,0.75)',
      x: -10,
      y: -10,
    };
  }
  if (n.curieEnabled) {
    n.borderWidth = 2;
  }
  if (n.deleted) { // Set this node as hidden since it is flagged for deletion
    n.color = {
      border: '#aaa',
      background: '#eee',
      highlight: { background: '#eee', border: '#aaa' },
      hover: { background: '#eee', border: '#aaa' },
    };
    n.font = { color: '#d38f8f', ital: { color: '#910000', size: 13 } };
    n.shapeProperties = { borderDashes: [3, 1] };
  }

  if ('label' in n) {
    if (('nodeSpecType' in n) && (n.nodeSpecType === CardTypes.NODETYPE)) {
      n.label = entityNameDisplay(n.label);
    }
    // else just keep your label
  } else if ('name' in n) {
    n.label = n.name;
  } else if (n.curie) {
    if (Array.isArray(n.curie)) {
      if (n.curie.length > 0) {
        n.label = n.curie[0]; // eslint-disable-line prefer-destructuring
      } else {
        n.label = '';
      }
    } else {
      n.label = n.curie;
    }
  } else if ('type' in n) {
    n.label = entityNameDisplay(n.type);
  } else if ('id' in n) {
    n.label = n.id;
  } else {
    n.label = '';
  }
  return n;
}

function defaultEdgePreProc(e) {
  let label = '';
  if ('predicate' in e) {
    label = e.predicate;
  } else if ('type' in e) {
    label = e.type;
  }
  if (Array.isArray(label)) {
    label = label.join(', ');
  }
  if (!('type' in e) && !(e.predicate && e.predicate.length > 0)) {
    e.arrows = {
      to: {
        enabled: false,
      },
    };
  }

  const smooth = { forceDirection: 'none' };

  e.from = e.source_id;
  e.to = e.target_id;
  e.chosen = false;
  e.width = 1;
  const defaultParams = {
    label,
    labelHighlightBold: false,
    font: {
      color: '#000',
      align: 'top',
      strokeColor: '#fff',
    },
    smooth,
    arrowStrikethrough: false,
  };

  return { ...e, ...defaultParams };
}
/* eslint-enable no-param-reassign */

/**
 * Query graph view
 * @param {Object} question contains nodes and edges
 * @param {Boolean} selectable can you click on the graph
 * @param {Number} height height of the graph
 * @param {Number} width width of the graph
 * @param {Function} graphClickCallback what happens when you click on the graph
 * @param {Function} nodePreProcFn creation of each node properties
 * @param {Function} edgePreProcFn creation of each edge properties
 * @param {Boolean} interactable can you hover over nodes and get info
 */
export default function QuestionGraphView(props) {
  const {
    question = { nodes: [], edges: [] }, selectable = false, height = 250, width = '100%',
    graphClickCallback, nodePreProcFn = defaultNodePreProc, edgePreProcFn = defaultEdgePreProc,
    interactable = true,
  } = props;
  const [displayGraph, setDisplayGraph] = useState(null);
  const [displayOptions, updateDisplayOptions] = useState({});
  const network = useRef(null);

  // Bind network fit callbacks to resize graph and cancel fit callbacks on start of zoom/pan
  function setNetworkCallbacks() {
    network.current.once('afterDrawing', () => network.current.fit());
    network.current.on('doubleClick', () => network.current.fit());
    network.current.on('zoom', () => network.current.off('afterDrawing'));
    network.current.on('dragStart', () => network.current.off('afterDrawing'));
  }

  /* eslint-disable no-param-reassign */
  function getDisplayGraph(rawGraph) {
    const graph = _.cloneDeep(rawGraph);

    // Adds vis.js specific tags to manage colors in graph
    const nodeTypeColorMap = getNodeTypeColorMap(config.concepts);

    graph.nodes.forEach((n) => {
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        border: '#000000',
        background: backgroundColor,
        highlight: { background: backgroundColor, border: '#000000' },
        hover: { background: backgroundColor, border: '#000000' },
      };
    }); /* eslint-enable no-param-reassign */

    graph.nodes = graph.nodes.map(nodePreProcFn);
    graph.edges = graph.edges.map(edgePreProcFn);
    return graph;
  }

  function getDisplayOptions(graph) {
    // potential change display depending on size/shape of graph
    let actualHeight = height;
    if (!(typeof actualHeight === 'string' || actualHeight instanceof String)) {
      // actualHeight is not a string must convert it
      actualHeight = `${actualHeight}px`;
    }

    // default layout (LR)
    let physics = false;
    let layout = {
      randomSeed: 0,
      hierarchical: {
        enabled: true,
        levelSeparation: 300,
        nodeSpacing: 200,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
        direction: 'LR',
        sortMethod: 'directed',
      },
    };

    // Switch to a simple quick spring layout without overlap
    if ((graph.nodes.length > 10) || (graph.edges.length > graph.nodes.length)) {
      physics = {
        minVelocity: 0.75,
        stabilization: {
          fit: true,
        },
        barnesHut: {
          gravitationalConstant: -300,
          centralGravity: 0.3,
          springLength: 200,
          springConstant: 0.05,
          damping: 0.95,
          avoidOverlap: 1,
        },
        timestep: 0.1,
        adaptiveTimestep: true,
      };
      layout = {
        randomSeed: 0,
        improvedLayout: true,
      };
    }

    let interaction = {
      zoomView: false,
      dragView: false,
      selectable: false,
      dragNodes: true,
    };
    if (interactable) {
      interaction = {
        hover: false,
        zoomView: true,
        dragView: true,
        hoverConnectedEdges: false,
        selectConnectedEdges: false,
        selectable,
        tooltipDelay: 50,
      };
    }

    return ({
      height: actualHeight,
      autoResize: true,
      layout,
      physics,
      edges: {
        color: {
          color: '#000',
          highlight: '#000',
          hover: '#000',
        },
        hoverWidth: 1,
        selectionWidth: 1,
      },
      nodes: {
        shape: 'box',
        labelHighlightBold: false,
      },
      interaction,
    });
  }

  function getGraphOptions() {
    let graph = _.cloneDeep(question);

    const isValid = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'nodes')) && (Object.prototype.hasOwnProperty.call(graph, 'edges'));
    if (isValid) {
      graph = getDisplayGraph(graph);
    }
    const graphOptions = getDisplayOptions(graph);

    setDisplayGraph(graph);
    updateDisplayOptions(graphOptions);
  }

  useEffect(() => {
    getGraphOptions();
  }, [question]);

  useEffect(() => {
    if (selectable && network.current) {
      setNetworkCallbacks();
    }
  }, [network.current]);

  return (
    <>
      {displayGraph !== null && (
        <Graph
          // key={shortid.generate()}
          graph={displayGraph}
          options={displayOptions}
          events={{ click: graphClickCallback }}
          getNetwork={(ref) => { network.current = ref; }} // Store network reference in the component
          style={{ width }}
        />
      )}
    </>
  );
}
