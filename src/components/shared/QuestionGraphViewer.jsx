import React from 'react';

import NodeTypes from '../questionNew/QuestionNewNodeTypes';

const Graph = require('react-graph-vis').default;

const shortid = require('shortid');

class QuestionGraphViewer extends React.Component {
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

  getGraph() {
    // Translate the query list to a graph for display
    if (this.props.graph == null) {
      return { nodes: [], edges: [] };
    }

    // Assume linear structure between the nodes
    const edges = this.props.graph.edges.map(
      e => ({
        id: shortid.generate(),
        from: e.start,
        to: e.end,
      }));

    const graph = { nodes: this.props.graph.nodes, edges };
    return graph;
  }

  addTagsToGraph(graph) {
    // Adds vis.js specific tags primarily to style graph as desired
    const undefinedColor = '#f2f2f2';
    const nodeTypeColorMap = {};
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

  render() {
    let graph = this.getGraph();
    graph = this.addTagsToGraph(graph);

    const options = {
      height: '250px',
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
      <Graph
        graph={graph}
        options={options}
        events={{}}
        getNetwork={(network) => { this.network = network; }} // Store network reference in the component
        style={{ width: '100%' }}
      />
    );
  }
}

export default QuestionGraphViewer;
