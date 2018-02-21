'use babel';

import React from 'react';
import { ProgressBar } from 'react-bootstrap';
import NodeTypes from './ProtocopQueryEditorNodeTypes';

const Graph = require('react-graph-vis').default;
const _ = require('lodash');


class ProtocopGraphViewer extends React.Component {
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
      height: '500px',
      physics: {
        enabled: true,
        forceAtlas2Based: {
          gravitationalConstant: -5.3,
          centralGravity: 0.01,
          springConstant: 0.1,
          springLength: 150,
          damping: 0.95,
          avoidOverlap: 0,
        },
        barnesHut: {
          gravitationalConstant: -200,
          centralGravity: 0.04,
          springLength: 25,
          springConstant: 0.025,
          damping: 0.95,
          avoidOverlap: 0,
        },
        solver: 'barnesHut',
        maxVelocity: 500,
        minVelocity: 0.9,
        stabilization: {
          enabled: true,
          iterations: 600,
          fit: true,
        },
      },
      layout: {
        hierarchical: false,
        improvedLayout: true,
      },
      edges: {
        smooth: { type: 'continuous' },
        length: 120,
      },
      nodes: {
        shape: 'box',
        mass: 6,
      },
      interaction: {
        hover: true,
        selectConnectedEdges: false,
      },
    };
  }

  componentDidMount() {
    this.setNetworkCallbacks();
  }

  shouldComponentUpdate(nextProps) {
    // Only redraw/remount component if graph components change
    if (nextProps.showProgress === this.state.showProgress && _.isEqual(this.props.graph, nextProps.graph)) {
      return false;
    }
    return true;
  }

  componentDidUpdate() {
    this.setNetworkCallbacks();
  }

  // Bind network fit callbacks to resize graph and cancel fit callbacks on start of zoom/pan
  setNetworkCallbacks() {
    if (!(this.network == null)) {
      this.network.on('afterDrawing', () => this.network.fit());
      this.network.on('doubleClick', () => this.network.fit());
      this.network.on('zoom', () => this.network.off('afterDrawing'));
      this.network.on('dragStart', () => this.network.off('afterDrawing'));
      this.network.on('stabilizationIterationsDone', () => this.setState({ showProgress: false }));
    }
  }

  addTagsToGraph(graph) {
    // Adds vis.js specific tags primarily to style graph as desired
    const undefinedColor = '#f2f2f2';
    const nodeTypeColorMap = {};
    Object.keys(NodeTypes).forEach(k => (nodeTypeColorMap[NodeTypes[k].tag] = NodeTypes[k].color));

    const g = _.cloneDeep(graph);
    g.nodes = g.nodes.map((n) => {
      const backgroundColor = nodeTypeColorMap[n.type] ? nodeTypeColorMap[n.type] : undefinedColor;
      n.color = {
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor },
      };
      n.label = n.name;
      return n;
    });

    // Prune out support edges
    g.edges = g.edges.filter(e => e.type === 'Result' || e.type === 'Lookup'); // Keep only result edges for this graph display
    return g;
  }

  render() {
    let graph = this.props.graph;
    const isSummary = !(graph == null) && Object.prototype.hasOwnProperty.call(graph, 'node_count');
    const isGraph = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'nodes'));
    let isEmpty = false;
    if (isGraph) {
      isEmpty = graph.nodes.length === 0;
      graph = this.addTagsToGraph(graph);
    }

    let hiddenProgress = 'hidden';
    let hiddenGraph = '';
    if (this.state.showProgress) {
      hiddenProgress = '';
      hiddenGraph = 'hidden';
    }
    return (
      // border: '1px solid #d1d1d1', boxShadow: '0px 0px 5px #c3c3c3',
      // key={shortid.generate()} // Forces component remount
      <div>
        { isGraph && !isEmpty &&
          <div>
            <div className={`${hiddenProgress}`} style={{ paddingTop: '15px' }}>
              <h5>Loading graph visualization</h5>
              <ProgressBar active now={100} />
            </div>
            <div className={`${hiddenGraph}`} style={{ fontFamily: 'Monospace' }}>
              <Graph
                graph={graph}
                options={this.graphOptions}
                style={{ width: '100%' }}
                events={{ selectNode: this.nodeSelectCallback, selectEdge: this.edgeSelectCallback }}
                getNetwork={(network) => { this.network = network; }} // Store network reference in the component
              />
            </div>
          </div>
        }
        { isGraph && isEmpty &&
          <div className="row">
            <div className="col-md-12" style={{ padding: '10px' }}>
              <h5>
                {'The blackboard is empty!'}
              </h5>
              <p>{'There may have been a problem with the query.'}</p>
            </div>
          </div>
        }
        { isSummary &&
          <div className="row">
            <div className="col-md-12" style={{ padding: '10px' }}>
              <h5>
                {'This graph is too large to display.'}
              </h5>
            </div>
          </div>
        }
        { !isGraph && !isSummary &&
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

export default ProtocopGraphViewer;
