import React from 'react';

import CardTypes from '../util/questionNewCardTypes';
import getNodeTypeColorMap from '../util/colorUtils';
import entityNameDisplay from '../util/entityNameDisplay';

const Graph = require('react-graph-vis').default;

const shortid = require('shortid');
const _ = require('lodash');

class MachineQuestionView extends React.Component {
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

  syncStateAndProps(newProps) {
    let graph = newProps.question;

    const isValid = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'nodes')) && (Object.prototype.hasOwnProperty.call(graph, 'edges'));
    if (isValid) {
      graph = this.getDisplayGraph(graph);
    }
    const graphOptions = this.getDisplayOptions(graph);

    this.setState({ displayGraph: graph, displayOptions: graphOptions })
  }

  shouldComponentUpdate(nextProps) {
    // Only redraw/remount component if graph components change
    if (_.isEqual(this.props.question, nextProps.question) && this.network) {
      return false;
    }
    return true;
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

  getDisplayGraph(rawGraph) {
    const graph = _.cloneDeep(rawGraph);

    // Adds vis.js specific tags primarily to style graph as desired
    const nodeTypeColorMap = getNodeTypeColorMap(this.props.concepts);

    graph.nodes.forEach((n) => {
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        border: '#000000',
        background: backgroundColor,
        highlight: { background: backgroundColor, border: '#000000' },
        hover: { background: backgroundColor, border: '#000000' },
      };

      n.isSet = ('set' in n) && (((typeof n.set === typeof true) && n.set) || ((typeof n.set === 'string') && n.set === 'true'));
      n.chosen = false;
      n.borderWidthSelected = 1;
      if (n.isSet) {
        n.borderWidth = 3;
        n.borderWidthSelected = 3;
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
            n.label = n.curie[0];
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

    graph.edges = graph.edges.map((e) => {
      const label = ('predicate' in e) ? e.predicate : '';
      const smooth = { forceDirection: 'none' };

      e.from = e.source_id;
      e.to = e.target_id;
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
    });

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
        barnesHut: {
          gravitationalConstant: -1000,
          centralGravity: 0.3,
          springLength: 200,
          springConstant: 0.05,
          damping: 0.95,
          avoidOverlap: 1,
        },
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
        selectable: false,
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
            events={{}}
            getNetwork={(network) => { this.network = network; }} // Store network reference in the component
            style={{ width: this.props.width }}
          />
        }
      </div>
    );
  }
}

MachineQuestionView.defaultProps = {
  height: 250,
  width: '100%',
  question: { nodes: [], edges: [] },
};

export default MachineQuestionView;
