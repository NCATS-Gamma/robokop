'use babel';

import React from 'react';
import NodeTypes from './ProtocopQueryEditorNodeTypes';

const Graph = require('react-graph-vis').default;
const shortid = require('shortid');
// const _ = require('lodash');

class ProtocopQueryViewer extends React.Component {
  constructor(props) {
    super(props);

    this.setNetworkCallbacks = this.setNetworkCallbacks.bind(this);
  }

  componentDidMount() {
    this.setNetworkCallbacks();
  }

  componentDidUpdate() {
    this.setNetworkCallbacks();
  }

  // Bind network fit callbacks to resize graph and cancel fit callbacks on start of zoom/pan
  setNetworkCallbacks() {
    this.network.once('afterDrawing', () => this.network.fit());
    this.network.on('doubleClick', () => this.network.fit());
    this.network.on('zoom', () => this.network.off('afterDrawing'));
    this.network.on('dragStart', () => this.network.off('afterDrawing'));
  }

  addTagsToGraph(graph) {
    // Adds vis.js specific tags primarily to style graph as desired
    const undefinedColor = '#f2f2f2';
    let nodeTypeColorMap = {};
    Object.keys(NodeTypes).forEach(k => (nodeTypeColorMap[NodeTypes[k].tag] = NodeTypes[k].color));
    graph.nodes = graph.nodes.map((n) => {
      const backgroundColor = nodeTypeColorMap[n.type] ? nodeTypeColorMap[n.type] : undefinedColor;
      n.color = {
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor },
      };
      return n;
    });
    return graph;
  }

  getGraph() {
    // Translate the query list to a graph for display
    let q = this.props.query;
    if (q == null || q.length === 0) {
      q = [];
    }
    // The nodes are fully specified by the query
    const nodes = q;

    // Assume linear structure between the nodes
    const edges = [];
    for (let iNode = 0; iNode < (nodes.length - 1); iNode += 1) {
      edges.push({
        id: shortid.generate(),
        from: nodes[iNode].id,
        to: nodes[iNode + 1].id,
      });
    }

    const graph = { nodes, edges };
    return graph;
  }

  render() {
    let graph = this.getGraph();
    graph = this.addTagsToGraph(graph);

    const options = {
      height: '350px',
      physics: false,
      layout: {
        hierarchical: {
          enabled: true,
          levelSeparation: 40,
          nodeSpacing: 40,
          direction: 'UD',
          parentCentralization: false,
        },
      },
      edges: {
        // physics: true,
        // smooth: { type: 'dynamic' },
        color: {
          color: '#000',
          highlight: '#3da4ed',
          hover: '#333',
        },
        length: 20,
      },
      nodes: {
        shape: 'box',
        color: {
          border: '#000',
          highlight: {
            border: '#3da4ed',
          },
          hover: {
            border: '#000',
          },
        },
        // mass: 6,
        // physics: true,
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true,
        hoverConnectedEdges: false,
        selectConnectedEdges: false,
      },
    };
    // console.log('Graphs is:', graph);
    // border: '1px solid #d1d1d1', boxShadow: '0px 0px 5px #c3c3c3'
    return (
      <div id="ProtocopQueryViewer">
        <div className="row">
          <div className="col-md-10 col-md-offset-1" style={{ fontFamily: 'Monospace' }}>
            <Graph
              graph={graph}
              options={options}
              events={{}}
              getNetwork={(network) => { this.network = network; }} // Store network reference in the component
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default ProtocopQueryViewer;
