import React from 'react';
import PropTypes from 'prop-types';
// import { Button } from 'react-bootstrap';

const Graph = require('react-graph-vis').default;
const _ = require('lodash');

const queryColorMap = {
  input: '#b3de69',
  operation: '#fed9a6',
};

const nodeType = node => (_.isEmpty(node.operation) ? 'input' : 'operation');

const propTypes = {
  height: PropTypes.string,
  width: PropTypes.string,
  graph: PropTypes.shape({
    nodes: PropTypes.array,
    edges: PropTypes.array,
  }).isRequired,
};

const defaultProps = {
  height: 500,
  width: 500,
};

class FlowbokopGraphViewer extends React.Component {
  constructor(props) {
    super(props);

    this.setNetworkCallbacks = this.setNetworkCallbacks.bind(this);
    this.addTagsToGraph = this.addTagsToGraph.bind(this);

    this.nodeSelectCallback = () => {};
    this.edgeSelectCallback = () => {};

    this.graphOptions = {
      height: '500px',
      autoResize: true,
      physics: {
        enabled: false,
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
        hierarchical: {
          enabled: true,
          levelSeparation: 150,
          nodeSpacing: 100,
          treeSpacing: 200,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
          direction: 'LR',        // UD, DU, LR, RL
          sortMethod: 'directed',  // hubsize, directed
        },
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
      // this.network.on('stabilizationIterationsDone', () => this.setState({ showProgress: false }));
    }
  }

  addTagsToGraph(graph) {
    // Adds vis.js specific tags primarily to style graph as desired
    const g = _.cloneDeep(graph);
    g.nodes = g.nodes.map((n) => {
      const backgroundColor = queryColorMap[nodeType(n)];
      n.color = {
        border: '#333333',
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor, border: '#333333' },
      };
      n.label = n.name;
      return n;
    });

    g.edges = g.edges.map((e) => {
      e.from = e.source_id;
      e.to = e.target_id;
      delete e.source_id;
      delete e.target_id;
      return e;
    });

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
          The current graph does not have any relevant nodes yet.
        </p>
      </div>
    );
  }

  render() {
    const showGraph = 'nodes' in this.props.graph && Array.isArray(this.props.graph.nodes) && this.props.graph.nodes.length > 0;
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
    );
  }
}

FlowbokopGraphViewer.propTypes = propTypes;
FlowbokopGraphViewer.defaultProps = defaultProps;

export default FlowbokopGraphViewer;
