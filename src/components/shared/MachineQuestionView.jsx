import React from 'react';

import getNodeTypeColorMap from '../util/colorUtils';
import entityNameDisplay from '../util/entityNameDisplay';

const Graph = require('react-graph-vis').default;

const shortid = require('shortid');
const _ = require('lodash');

class MachineQuestionView extends React.Component {
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
    if (this.props.question == null) {
      return { nodes: [], edges: [] };
    }

    const question = _.cloneDeep(this.props.question);

    question.nodes.forEach((n) => {
      if (!('id' in n)) {
        n.id = shortid.generate();
      }
    });
    question.edges.forEach((e) => {
      if (!('id' in e)) {
        e.id = shortid.generate();
      }
    });

    return question;
  }

  addTagsToGraph(graph) {
    // Adds vis.js specific tags primarily to style graph as desired
    const nodeTypeColorMap = getNodeTypeColorMap(this.props.concepts);
    graph.nodes.forEach((n) => {
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor },
      };

      if ('label' in n) {
        if (('nodeSpecType' in n) && (n.nodeSpecType === CardTypes.NODETYPE)) {
          n.label = entityNameDisplay(n.label);
        }
        // else just keep your label
      } else if ('identifiers' in n) {
        if (Array.isArray(n.identifiers)) {
          if (n.identifiers.length > 0) {
            n.label = n.identifiers[0];
          } else {
            n.label = '';
          }
        } else {
          n.label = n.identifiers;
        }
      } else if ('type' in n) {
        n.label = entityNameDisplay(n.type);
      } else if ('id' in n) {
        n.label = n.id;
      } else {
        n.label = '';
      }
    });
    
    return graph;
  }

  render() {
    let graph = this.getGraph();
    graph = this.addTagsToGraph(graph);

    const options = {
      height: '250px',
      physics: true,
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

MachineQuestionView.defaultProps = {
  question: {
    nodes: [],
    edges: [],
  },
}

export default MachineQuestionView;