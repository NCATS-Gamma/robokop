import React from 'react';

import { Button } from 'react-bootstrap';
import GoSync from 'react-icons/lib/go/sync';

import getNodeTypeColorMap from '../questionNew/ColorUtils';

const Graph = require('react-graph-vis').default;
const _ = require('lodash');


class KnowledgeGraphViewer extends React.Component {
  constructor(props) {
    super(props);

    this.setNetworkCallbacks = this.setNetworkCallbacks.bind(this);
    this.addTagsToGraph = this.addTagsToGraph.bind(this);

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
        color: '#333333',
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

  // shouldComponentUpdate(nextProps) {
  //   // Only redraw/remount component if graph components change
  //   if (nextProps.showProgress === this.state.showProgress && _.isEqual(this.props.graph, nextProps.graph)) {
  //     return false;
  //   }
  //   return true;
  // }

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
    const nodeTypeColorMap = getNodeTypeColorMap(this.props.concepts);

    const g = _.cloneDeep(graph);
    g.nodes = g.nodes.map((n) => {
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        border: '#333333',
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor, border: '#333333' },
      };
      n.label = n.name;
      return n;
    });

    // Prune out support edges
<<<<<<< HEAD
    // g.edges = g.edges.filter(e => e.type === 'Result' || e.type === 'Lookup'); // Keep only result edges for this graph display
=======
    g.edges = g.edges.filter(e => e.type !== 'Support'); // Keep only result edges for this graph display
>>>>>>> 6001e2117e08710a83c41766cc3c85c0ec783a5c
    return g;
  }

  renderGraph() {
    const graph = this.addTagsToGraph(this.props.graph);

    this.graphOptions.height = this.props.height;
    return (
      // key={shortid.generate()} // Forces component remount
      <div style={{ height: this.props.height, width: this.props.width }} >
        <div style={{ fontFamily: 'Monospace' }}>
          <Graph
            graph={graph}
            options={this.graphOptions}
            style={{ width: this.props.width }}
            events={{ selectNode: this.nodeSelectCallback, selectEdge: this.edgeSelectCallback }}
            getNetwork={(network) => { this.network = network; }} // Store network reference in the component
          />
        </div>
      </div>
    );
  }
  renderNoGraph() {
    return (
      <div style={{ margin: '15px' }}>
        <p>
          The current knowledge graph does not have any relevant nodes for this question. You may need to update the knowledge graph for this question.
        </p>
        <Button title="Update KG and Get New Answer Set" onClick={this.props.callbackRefresh}>
          Update Knowledge Graph
          <br />
          <GoSync />
        </Button>
      </div>
    );
  }

  render() {
    const showGraph = this.props.graph.nodes.length > 0
    const showNoGraph = !showGraph;
    return (
      <div>
        {showGraph &&
          this.renderGraph()
        }
        {showNoGraph &&
          this.renderNoGraph()
        }
      </div>
    )
  }
}

// KnowledgeGraphViewer.defaultProps = {
//   height: '500px',
//   width: '500px',
// };


export default KnowledgeGraphViewer;
