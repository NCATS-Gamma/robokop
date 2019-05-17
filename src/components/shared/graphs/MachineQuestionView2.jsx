import React from 'react';
import PropTypes from 'prop-types';
import CardTypes from '../../util/questionNewCardTypes';
import getNodeTypeColorMap from '../../util/colorUtils';
import entityNameDisplay from '../../util/entityNameDisplay';

const Graph = require('react-graph-vis').default;

const shortid = require('shortid');
const _ = require('lodash');

const propTypes = {
  concepts: PropTypes.arrayOf(PropTypes.string).isRequired,
  question: PropTypes.shape({
    nodes: PropTypes.array,
    edges: PropTypes.array,
  }),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectable: PropTypes.bool, // Whether node and edge can be selected
  nodePreProcFn: PropTypes.func,
  edgePreProcFn: PropTypes.func,
  // nodeSelectCallback: PropTypes.func,
  // edgeSelectCallback: PropTypes.func,
};

const defaultProps = {
  height: 250,
  width: '100%',
  question: { nodes: [], edges: [] },
  selectable: false,
  nodePreProcFn: defaultNodePreProc, // eslint-disable-line no-use-before-define
  edgePreProcFn: defaultEdgePreProc, // eslint-disable-line no-use-before-define
  // nodeSelectCallback: () => {},
  // edgeSelectCallback: () => {},
};

// Default pre-processing method on each node object to return updated node obj
/* eslint-disable no-param-reassign */
function defaultNodePreProc(n) {
  n.isSet = ('set' in n) && (((typeof n.set === typeof true) && n.set) || ((typeof n.set === 'string') && n.set === 'true'));
  n.chosen = false; // Not needed since borderWidth manually set below
  n.borderWidth = 1;
  n.borderWidthSelected = 2;
  if (n.isSet) {
    n.borderWidth = 3;
    n.borderWidthSelected = 5;
  } else {
    n.borderWidth = 1;
  }
  if (n.isSelected) { // Override borderwidth when isSelected set by user thru props
    n.borderWidth = n.borderWidthSelected;
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
  if (e.isSelected) {
    e.width = 2;
  } else {
    e.width = 1;
  }
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

class MachineQuestionView2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      displayGraph: null,
      displayOptions: {},
    };

    this.syncStateAndProps = this.syncStateAndProps.bind(this);
    this.setNetworkCallbacks = this.setNetworkCallbacks.bind(this);
  }

  componentDidMount() {
    this.syncStateAndProps(this.props);
  }
  componentWillReceiveProps(nextProps) {
    this.syncStateAndProps(nextProps);
  }

  shouldComponentUpdate(nextProps) {
    // Only redraw/remount component if graph components change
    if (_.isEqual(this.props.question, nextProps.question) && this.network) {
      return false;
    }
    return true;
  }

  componentDidUpdate() {
    // this.setNetworkCallbacks();
  }

  syncStateAndProps(newProps) {
    let graph = newProps.question;

    const isValid = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'nodes')) && (Object.prototype.hasOwnProperty.call(graph, 'edges'));
    if (isValid) {
      graph = this.getDisplayGraph(graph);
    }
    const graphOptions = this.getDisplayOptions(graph);

    this.setState({ displayGraph: graph, displayOptions: graphOptions }, this.setNetworkCallbacks);
  }

  // Bind network fit callbacks to resize graph and cancel fit callbacks on start of zoom/pan
  setNetworkCallbacks() {
    this.network.once('afterDrawing', () => this.network.fit());
    this.network.on('doubleClick', () => this.network.fit());
    this.network.on('zoom', () => this.network.off('afterDrawing'));
    this.network.on('dragStart', () => this.network.off('afterDrawing'));
  }

  /* eslint-disable no-param-reassign */
  getDisplayGraph(rawGraph) {
    const graph = _.cloneDeep(rawGraph);

    // Adds vis.js specific tags to manage colors in graph
    const nodeTypeColorMap = getNodeTypeColorMap(this.props.concepts);

    graph.nodes.forEach((n) => {
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        border: '#000000',
        background: backgroundColor,
        highlight: { background: backgroundColor, border: '#000000' },
        hover: { background: backgroundColor, border: '#000000' },
      };
    }); /* eslint-enable no-param-reassign */

    graph.nodes = graph.nodes.map(this.props.nodePreProcFn);
    graph.edges = graph.edges.map(this.props.edgePreProcFn);
    return graph;
  }

  getDisplayOptions(graph) {
    // potential change display depending on size/shape of graph
    let { height } = this.props;
    if (!(typeof height === 'string' || height instanceof String)) {
      // height is not a string must convert it
      height = `${height}px`;
    }

    // default layout (LR)
    let physics = false;
    let layout = {
      randomSeed: 0,
      hierarchical: {
        enabled: true,
        levelSeparation: 200,
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
    if ((graph.nodes.length > 10) || (graph.edges.length >= graph.nodes.length)) {
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

    return ({
      height,
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
      interaction: {
        hover: false,
        zoomView: true,
        dragView: true,
        hoverConnectedEdges: false,
        selectConnectedEdges: false,
        selectable: this.props.selectable,
        tooltipDelay: 50,
      },
    });
  }
  render() {
    const { displayGraph } = this.state;
    const isValid = !(displayGraph == null);

    return (
      <div>
        {isValid &&
          <Graph
            key={shortid.generate()}
            graph={displayGraph}
            options={this.state.displayOptions}
            events={{ click: this.props.graphClickCallback }}
            getNetwork={(network) => { this.network = network; }} // Store network reference in the component
            style={{ width: this.props.width }}
          />
        }
      </div>
    );
  }
}

MachineQuestionView2.propTypes = propTypes;
MachineQuestionView2.defaultProps = defaultProps;

export default MachineQuestionView2;
