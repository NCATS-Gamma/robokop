import React from 'react';

import CardTypes from '../../util/questionNewCardTypes';
import getNodeTypeColorMap from '../../util/colorUtils';
import entityNameDisplay from '../../util/entityNameDisplay';

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
    const edges = this.props.graph.edges.map(e => ({
      id: shortid.generate(),
      from: e.source_id,
      to: e.target_id,
    }));
    const nodes = this.props.graph.nodes.map(n => ({ ...n })); // Deep copy.

    const graph = { nodes, edges };
    return graph;
  }

  addTagsToGraph(graph) { /* eslint-disable no-param-reassign */
    // Adds vis.js specific tags primarily to style graph as desired
    const nodeTypeColorMap = getNodeTypeColorMap(this.props.concepts);
    graph.nodes = graph.nodes.map((n) => {
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor },
      };

      n.isSet = ('set' in n) && (((typeof n.set === typeof true) && n.set) || ((typeof n.set === 'string') && n.set === 'true'));

      n.borderWidthSelected = 1;
      if (n.isSet) {
        n.borderWidth = 2;
      } else {
        n.borderWidth = 1;
      }

      if ('label' in n) {
        if (('nodeSpecType' in n) && (n.nodeSpecType === CardTypes.NODETYPE)) {
          n.label = entityNameDisplay(n.label);
        }
        // else just keep your label
      } else if ('name' in n) {
        n.label = n.name;
      } else if ('curie' in n) {
        if (Array.isArray(n.curie)) {
          if (n.curie.length > 0) {
            [n.label] = n.curie; // array destructure gets 0 index
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
    });
    return graph;
  }

  render() {
    let graph = this.getGraph();
    graph = this.addTagsToGraph(graph);

    const options = {
      height: '250px',
      autoResize: true,
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
        },
        length: 20,
      },
      nodes: {
        shape: 'box',
        color: {
          border: '#000',
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
