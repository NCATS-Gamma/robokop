'use babel';

import React from 'react';
import NodeTypes from './ProtocopConstructionGraphNodeTypes';

const Graph = require('react-graph-vis').default;
const _ = require('lodash');

class ProtocopConstructionGraphViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showProgress: true,
    };

    this.setNetworkCallbacks = this.setNetworkCallbacks.bind(this);
    this.addTagsToGraph = this.addTagsToGraph.bind(this);
    // this.nodeSelectCallback = event => this.setState({ selectedNodeId: event.nodes[0] });
    // this.nodeSelectCallback = this.nodeSelectCallback.bind(this);

    // this.nodeSelectCallback = event => console.log('Node click event:', event);
    // this.edgeSelectCallback = event => console.log('Edge click event:', event);
    this.nodeSelectCallback = () => {};
    this.edgeSelectCallback = () => {};

    this.graphOptions = {
      height: '350px',
      physics: false,
      layout: {
        hierarchical: {
          enabled: true,
          levelSeparation: 70,
          nodeSpacing: 70,
          direction: 'UD',
          parentCentralization: false,
        },
      },
      edges: {
        // physics: true,
        // smooth: { type: 'dynamic' },
        color: {
          color: '#000',
          highlight: '#848484',
          hover: '#333',
        },
        length: 20,
      },
      nodes: {
        shape: 'box',
        color: {
          border: '#000',
          highlight: {
            border: '#848484',
          },
          hover: {
            border: '#333',
          },
        },
        // mass: 6,
        // physics: true,
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true,
        // hoverConnectedEdges: true,
      },
    };
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
    const undefinedColor = '#aaa';
    const nodeTypeColorMap = {};
    Object.keys(NodeTypes).forEach(k => (nodeTypeColorMap[NodeTypes[k].tag] = NodeTypes[k].color));

    const g = _.cloneDeep(graph);
    g.nodes = g.nodes.map((n) => {
      n.color = { background: nodeTypeColorMap[n.name] ? nodeTypeColorMap[n.name] : undefinedColor };
      n.label = n.name;
      return n;
    });

    g.edges = g.edges.map(e => ({ ...e, ...{ label: e.reference } })); // Add reference label to edges
    return g;
  }

  render() {
    let graph = this.props.graph;
    const isValid = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'nodes'));
    if (isValid) {
      graph = this.addTagsToGraph(graph);
    }

    return (
      // border: '1px solid #d1d1d1', boxShadow: '0px 0px 5px #c3c3c3',
      // key={shortid.generate()} // Forces component remount
      <div>
        { isValid &&
          <div style={{ fontFamily: 'Monospace' }}>
            <Graph
              graph={graph}
              options={this.graphOptions}
              events={{}}
              getNetwork={(network) => { this.network = network; }} // Store network reference in the component
            />
          </div>
        }
        { !isValid &&
          <div className="row">
            <div className="col-md-12" style={{ padding: '10px' }}>
              <p>{'There was a problem with this Blackboard.'}</p>
            </div>
          </div>
        }
      </div>
    );
  }
}

export default ProtocopConstructionGraphViewer;
