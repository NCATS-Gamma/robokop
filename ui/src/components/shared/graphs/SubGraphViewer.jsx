import React, { useState, useEffect, useRef } from 'react';
import Graph from 'react-graph-vis';
import shortid from 'shortid';
import _ from 'lodash';

import getNodeTypeColorMap from '../../../utils/colorUtils';
import entityNameDisplay from '../../../utils/entityNameDisplay';

const keyBlocklist = ['isSet', 'labels', 'label', 'equivalent_identifiers', 'type', 'id', 'degree', 'name', 'title', 'color', 'binding', 'scoreVector', 'aggScore', 'level'];

const styles = {
  supportEdgeColors: {
    color: '#aaa',
    hover: '#aaa',
    opacity: 0.5,
  },
};

const defaultGraphOptions = {
  autoResize: true,
  // TODO: this prop would be helpful, but doesn't seem to do anything
  // https://visjs.github.io/vis-network/docs/network/#options
  clickToUse: true,
  height: '500px',
  physics: {
    minVelocity: 1,
    barnesHut: {
      gravitationalConstant: -300,
      centralGravity: 0.3,
      springLength: 120,
      springConstant: 0.05,
      damping: 0.2,
      avoidOverlap: 1,
    },
  },
  layout: {
    randomSeed: 0,
    improvedLayout: false,
  },
  edges: {
    color: {
      color: '#000',
      highlight: '#000',
      hover: '#000',
    },
    hoverWidth: 1,
    selectionWidth: 1,
    // smooth: {
    //   enabled: true,
    //   type: 'dynamic',
    // },
  },
  nodes: {
    shape: 'box',
    labelHighlightBold: false,
    borderWidthSelected: 2,
    borderWidth: 1,
    chosen: false,
  },
  interaction: {
    hover: true,
    zoomView: true,
    dragView: true,
    hoverConnectedEdges: true,
    selectConnectedEdges: false,
    selectable: true,
    tooltipDelay: 400,
  },
};

/**
 * SubGraph Viewer
 * @param {object} subgraph
 * @param {string} layoutStyle direction of the graph, options are auto, vertical, horizontal, or heirarchical
 * @param {function} callbackOnGraphClick function to call on graph click
 * @param {number} height the height of the graph
 * @param {boolean} showSupport should the graph show support edges
 * @param {boolean} omitEdgeLabel should the graph hide edge labels
 * @param {boolean} varyEdgeSmoothRoundness should the graph edges curve so as not to overlap
 * @param {number} layoutRandomSeed the seed number at which to generate the graph
 * @param {array} concepts an array of node types
 */
export default function SubGraphViewer(props) {
  const {
    subgraph, layoutStyle = 'auto', callbackOnGraphClick = () => {}, height = 600,
    showSupport = false, omitEdgeLabel = false, varyEdgeSmoothRoundness = false,
    layoutRandomSeed = 0, concepts,
  } = props;
  const [displayGraph, updateDisplayGraph] = useState(null);
  const [displayGraphOptions, updateGraphOptions] = useState(defaultGraphOptions);
  const network = useRef(null);

  // Bind network fit callbacks to resize graph and cancel fit callbacks on start of zoom/pan
  function setNetworkCallbacks() {
    const stopLayout = () => {
      network.current.stopSimulation();
      network.current.physics.physicsEnabled = false;
    };
    const afterDraw = () => {
      setTimeout(() => { stopLayout(); network.current.fit(); }, 50);
    };
    const startLayout = () => {
      network.current.once('afterDrawing', afterDraw);
      network.current.physics.physicsEnabled = true;
      network.current.startSimulation();
    };
    const toggleLayout = () => {
      if (network.current.physics.physicsEnabled) {
        stopLayout();
      } else {
        startLayout();
      }
    };

    try {
      network.current.once('afterDrawing', afterDraw);
      network.current.on('doubleClick', () => { network.current.off('afterDrawing'); network.current.fit(); toggleLayout(); });
      network.current.on('zoom', () => network.current.off('afterDrawing'));
      network.current.on('dragStart', () => network.current.off('afterDrawing'));
      network.current.on('dragEnd', () => { setTimeout(stopLayout, 5); });
      // network.current.on('stabilizationIterationsDone', () => { setTimeout(() => network.current.stopSimulation(), 5); });
    } catch (err) {
      console.log(err);
    }
  }

  function getGraphOptions(graph) {
    const graphOptions = _.cloneDeep(defaultGraphOptions);
    const nNodes = 'nodes' in graph ? graph.nodes.length : 0;

    graphOptions.height = `${height}px`;
    let modifiedOptions = {};
    if (layoutStyle === 'auto') {
      modifiedOptions = {
        layout: {
          randomSeed: layoutRandomSeed,
          // improvedLayout: true,
        },
      };
    }

    // Check for graph duplicate edges
    // In the event of duplicate edges directed layout doesn't work, we must stick with physics and auto
    const duplicateEdges = graph.edges.reduce((val, e) => (val || e.moreThanOneEdge), false);
    if (!duplicateEdges && ((layoutStyle === 'vertical') || (layoutStyle === 'horizontal') || nNodes < 3)) {
      let direction = 'LR';
      if (layoutStyle === 'vertical') {
        direction = 'UD';
      }

      modifiedOptions = {
        layout: {
          randomSeed: undefined,
          hierarchical: {
            enabled: true,
            levelSeparation: 500,
            nodeSpacing: 200,
            treeSpacing: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
            direction,
            sortMethod: 'directed',
          },
        },
        physics: false,
      };
    }

    if (layoutStyle === 'hierarchical') {
      modifiedOptions = {
        layout: {
          randomSeed: undefined,
          hierarchical: {
            enabled: true,
            levelSeparation: 400,
            nodeSpacing: 50,
            treeSpacing: 70,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
            direction: 'LR',
            sortMethod: 'directed',
          },
        },
        physics: false,
      };
    }

    // Last minute modification of graph options based on size of graph
    if (nNodes < 31 && 'barnesHut' in graphOptions.physics) {
      graphOptions.physics.barnesHut.avoidOverlap = 1;
    }

    return { ...graphOptions, ...modifiedOptions };
  }

  // Method to add requisite tags to graph definition JSON before passing to vis.js
  function addTagsToGraph(graph) {
    // Adds vis.js specific tags primarily to style graph as desired
    const g = _.cloneDeep(graph);
    const nodeTypeColorMap = getNodeTypeColorMap(concepts); // We could put standardized concepts here

    // remove all duplicate nodes
    const nodeIds = new Set();
    g.nodes = g.nodes.filter((unique) => {
      if (nodeIds.has(unique.id)) {
        return false;
      }
      nodeIds.add(unique.id);
      return true;
    });
    // remove all duplicate edges
    const edgeIds = new Set();
    g.edges = g.edges.filter((unique) => {
      if (edgeIds.has(unique.id)) {
        return false;
      }
      edgeIds.add(unique.id);
      return true;
    });

    g.nodes.forEach((n) => {
      if (Array.isArray(n.type)) {
        n.type = concepts.find((concept) => concept !== 'named_thing' && n.type.includes(concept));
      }
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        border: '#000000',
        background: backgroundColor,
        highlight: { background: backgroundColor, border: '#000000' },
        hover: { background: backgroundColor, border: '#000000' },
      };

      // Set shortened node labels and tool-tip for each node
      n.label = n.name && n.name.length > 15 ? `${n.name.substring(0, 13)}...` : n.name || n.id || 'Unknown';
      let extraFields = Object.keys(n).filter((property) => !keyBlocklist.includes(property));
      extraFields = extraFields.map((property) => `<div key={${shortid.generate()}}><span class="field-name">${property}: </span>${n[property]}</div>`);
      n.title = (
        `<div class="vis-tooltip-inner">
          <div><span class="title">${n.name}</span></div>
          <div><span class="field-name">id: </span>${n.id}</div>
          <div><span class="field-name">type: </span>${entityNameDisplay(n.type)}</div>
          ${extraFields.join('')}
        </div>`
      );
    });

    // Separate out support and regular edges to modify things differently
    const edgesRegular = g.edges.filter((e) => e.type !== 'literature_co-occurrence');
    const edgesSupport = g.edges.filter((e) => e.type === 'literature_co-occurrence');

    edgesSupport.forEach((e) => {
      // Make sure support edges actually have publications
      e.duplicateEdge = false; // Also by default do not delete support edges unless duplicate
      if (('publications' in e && Array.isArray(e.publications))) {
        // Everything is good
      } else if (('publications' in e && !Array.isArray(e.publications))) {
        // Single entry comes as a string
        e.publications = [e.publications];
      } else if (!('publications' in e)) {
        e.publications = []; // How did this happen?
      }
      e.moreThanOneEdge = false; // If we don't remove a support edge it is because it is the only left.

      // Check if this is a self support edge
      // These are not particularly informative in display
      e.selfEdge = e.source_id === e.target_id;
      // e.selfEdge = false;
    });

    const mashSupportAndKnowledgeSourceEdges = false;
    if (mashSupportAndKnowledgeSourceEdges) {
      edgesRegular.forEach((e) => {
        // Find support edges between the same two nodes and merge publication lists

        // Find existing publications attached to the edge.
        let edgePublications = [];
        if ('publications' in e) {
          if (Array.isArray(e.publications)) {
            edgePublications = e.publications;
          } else if (typeof myVar === 'string') {
            edgePublications = [e.publications];
          }
        }

        // Find a corresponding support edge
        const sameNodesSupportEdge = edgesSupport.find((s) => (((e.source_id === s.source_id) && (e.target_id === s.target_id)) || ((e.source_id === s.target_id) && (e.target_id === s.source_id))));
        if (sameNodesSupportEdge) {
          // We have a repeated edge
          sameNodesSupportEdge.duplicateEdge = true; // Mark for deletion

          const supportPublications = sameNodesSupportEdge.publications;
          edgePublications = edgePublications.concat(supportPublications);
          edgePublications = edgePublications.filter((p, i, self) => self.indexOf(p) === i); // Unique
        }
        e.publications = edgePublications;
      });
    }

    edgesRegular.forEach((e) => {
      // Find edges that go between the same two nodes and mark them accordingly

      // Find a corresponding support edge
      const sameNodesEdge = edgesRegular.filter((e2) => (((e.source_id === e2.source_id) && (e.target_id === e2.target_id)) || ((e.source_id === e2.target_id) && (e.target_id === e2.source_id))));
      sameNodesEdge.splice(sameNodesEdge.findIndex((e2) => e2.id === e.id), 1);
      if (sameNodesEdge.length > 0) {
        // We have a repeated edge
        e.moreThanOneEdge = true;
      } else {
        e.moreThanOneEdge = false;
      }
    });

    // Remove the duplicated support edges
    g.edges = [].concat(edgesSupport.filter((s) => !s.duplicateEdge && !s.selfEdge), edgesRegular);
    // g.edges = [].concat(edgesRegular, edgesSupport.filter(s => !s.duplicateEdge && !s.selfEdge));

    if (varyEdgeSmoothRoundness) {
      // For each node pair
      // Find any edges between those nodes (in either direction)
      // Loop through those edges and set smooth
      const types = ['curvedCCW', 'curvedCW'];
      for (let iNode = 0; iNode < g.nodes.length; iNode += 1) {
        const n1 = g.nodes[iNode];
        for (let jNode = iNode; jNode < g.nodes.length; jNode += 1) {
          const n2 = g.nodes[jNode];
          const theseNodeEdges = g.edges.filter((e) => (((e.source_id === n1.id) && (e.target_id === n2.id)) || ((e.target_id === n1.id) && (e.source_id === n2.id))));
          let roundnessStep = 0.15;
          if (theseNodeEdges.length > 13) {
            // Roundness must be between 0 and 1. In general for less than 13 edges steps of 0.15 looks good
            // If we have more than 13 we need to decrease this to squeeze them all in the 0 to 1 range
            // We divide by two beceause we alternate top and bottom
            roundnessStep = 1 / (Math.ceil(theseNodeEdges.length) / 2);
          }
          theseNodeEdges.forEach((e, i) => {
            const typeInd = (i + (e.source_id === n1.id)) % 2;
            e.smooth = {
              enabled: true,
              type: types[typeInd],
              roundness: Math.floor((i + 1) / 2) * roundnessStep,
            };
          });
        }
      }
    }
    // TODO: Remove any straggler duplicate edges (Fix me)
    // const fromTo = [];
    // const deleteMe = g.edges.map((e) => {
    //   const thisFromTo = `${e.source_id}_${e.target_id}`;
    //   if (fromTo.includes(thisFromTo)) {
    //     return true;
    //   }
    //   fromTo.push(thisFromTo);
    //   return false;
    // });
    // g.edges = g.edges.filter((e, i) => !deleteMe[i]);

    // Add parameters to edges like curvature and labels and such
    g.edges = g.edges.map((e) => {
      let typeDependentParams = {};
      let label = e.type;
      let nPublications = e.publications ? e.publications.length : 0;
      if (nPublications === 0 && 'nPublications' in e) {
        ({ nPublications } = e); // object destructure, grabs variable out of object
      }
      if (nPublications > 0) {
        label = `${e.type} (${nPublications})`;
      }

      // const value = Math.ceil((Math.log(nPublications + 1) / Math.log(5)) * 2) + 1;
      // const value = Math.ceil((15 / (1 + Math.exp(-1 * (-1 + (0.02 * nPublications))))) - 3);
      const value = (4 / (1 + Math.exp(-1 * (-1 + (0.01 * nPublications))))) - 1;

      if (e.type === 'literature_co-occurrence') {
        // Publication Edge
        label = `${nPublications}`; // Remove the type labeled to keep it small

        let smoothLit = {
          enabled: true,
          type: 'dynamic',
        };
        if (varyEdgeSmoothRoundness) {
          smoothLit = e.smooth;
        }
        typeDependentParams = {
          color: styles.supportEdgeColors,
          // dashes: [2, 4],
          physics: false,
          font: {
            color: '#777',
            align: 'middle',
            strokeColor: '#fff',
          },
          arrows: {
            to: {
              enabled: false,
            },
          },
          smooth: smoothLit,
        };
      }

      if (omitEdgeLabel) {
        label = '';
      }
      let smooth = { forceDirection: 'none' };
      if (e.moreThanOneEdge) {
        smooth = { enabled: true, type: 'dynamic' };
      }
      if (varyEdgeSmoothRoundness) {
        ({ smooth } = e);
      }
      e.from = e.source_id;
      e.to = e.target_id;
      // Assign a unique id to the edge
      if (e.id) {
        e.edgeIdFromKG = e.id;
      }

      const defaultParams = {
        label,
        labelHighlightBold: false,
        value,
        font: {
          color: '#000',
          align: 'top',
          strokeColor: '#fff',
        },
        smooth,
        scaling: {
          min: 0.1,
          max: 10,
          label: false,
          customScalingFunction: (min, max, total, val) => Math.max(val, 0),
        },

        arrowStrikethrough: false,
      };

      return { ...e, ...defaultParams, ...typeDependentParams };
    });
    if (!showSupport) {
      g.edges = g.edges.filter((e) => e.type !== 'literature_co-occurrence');
    }

    return g;
  }

  function syncStateAndProps() {
    let graph = _.cloneDeep(subgraph);

    const isValid = !(graph == null) && 'nodes' in graph;
    if (isValid) {
      graph = addTagsToGraph(graph);
    }
    const graphOptions = getGraphOptions(graph);

    updateDisplayGraph(graph);
    updateGraphOptions(graphOptions);

    // this.setState({ displayGraph: graph, displayGraphOptions: graphOptions }, this.setNetworkCallbacks);
  }

  useEffect(() => {
    syncStateAndProps();
  }, [subgraph, layoutStyle]);

  useEffect(() => {
    if (network.current) {
      setNetworkCallbacks();
    }
  }, [displayGraphOptions, network]);

  // componentWillReceiveProps(nextProps) {
  //   this.syncStateAndProps(nextProps);
  // }

  // shouldComponentUpdate(nextProps) {
  //   // Only redraw/remount component if subgraph components change
  //   if (_.isEqual(this.props.subgraph, nextProps.subgraph) && this.network && (this.props.layoutStyle === nextProps.layoutStyle)) {
  //     return false;
  //   }
  //   return true;
  // }

  function clickCallback(event) { /* eslint-disable no-param-reassign */
    // Add edge objects not just ids
    event.edgeObjects = event.edges.map((eId) => displayGraph.edges.find((displayEdge) => displayEdge.id === eId));
    event.graph = displayGraph;
    callbackOnGraphClick(event);
  }

  return (
    <>
      {displayGraph !== null && (
        <div style={{ fontFamily: 'Monospace' }}>
          <Graph
            // key={shortid.generate()} // Forces component remount
            graph={displayGraph}
            style={{ width: '100%' }}
            options={displayGraphOptions}
            events={{ click: clickCallback }}
            getNetwork={(ref) => { network.current = ref; }} // Store network reference in the component
          />
        </div>
      )}
    </>
  );
}
