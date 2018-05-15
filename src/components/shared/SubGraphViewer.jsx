import React from 'react';
import getNodeTypeColorMap from '../util/colorUtils';

const Graph = require('react-graph-vis').default;
const shortid = require('shortid');
const _ = require('lodash');
const seedrandom = require('seedrandom');

class SubGraphViewer extends React.Component {
  constructor(props) {
    super(props);

    this.addTagsToGraph = this.addTagsToGraph.bind(this);
    this.setNetworkCallbacks = this.setNetworkCallbacks.bind(this);
    this.clickCallback = event => this.props.callbackOnGraphClick(event);

    this.styles = {
      supportEdgeColors: {
        color: '#aaa',
        highlight: '#3da4ed',
        hover: '#aaa',
      },
    };
    this.graphOptions = {
      height: '500px',
      physics: true,
      // layout: {
      //   hierarchical: {
      //     enabled: false,
      //   },
      // },
      layout: {
        randomSeed: 0,
      },
      edges: {
        smooth: true,
        color: {
          color: '#000',
          highlight: '#3da4ed',
          hover: '#000',
        },
        width: 1.5,
        hoverWidth: 1,
        selectionWidth: 1,
      },
      nodes: {
        shape: 'box',
        labelHighlightBold: true,
        color: {
          border: '#000',
          highlight: {
            border: '#848484',
          },
          hover: {
            border: '#333',
          },
        },
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: false,
        selectable: true,
        tooltipDelay: 50,
      },
    };
  }

  componentDidMount() {
    this.setNetworkCallbacks();
  }

  shouldComponentUpdate(nextProps) {
    // Only redraw/remount component if subgraph components change
    if (_.isEqual(this.props.subgraph, nextProps.subgraph)) {
      return false;
    }
    return true;
  }

  componentDidUpdate() {
    this.setNetworkCallbacks();
  }

  // Bind network fit callbacks to resize graph and cancel fit callbacks on start of zoom/pan
  setNetworkCallbacks() {
    try {
      this.network.on('afterDrawing', () => this.network.fit());
      this.network.on('doubleClick', () => this.network.fit());
      this.network.on('zoom', () => this.network.off('afterDrawing'));
      this.network.on('dragStart', () => this.network.off('afterDrawing'));
    } catch (err) {
      console.log(err);
    }
  }

  getGraphOptions() {
    const { graphOptions } = this;

    graphOptions.height = `${this.props.height}px`;
    let modifiedOptions = {};
    if (this.props.layoutStyle === 'auto') {
      modifiedOptions = {
        layout: {
          randomSeed: this.props.layoutRandomSeed,
          hierarchical: {
            enabled: false,
          },
        },
        physics: true,
      };
    }

    if ((this.props.layoutStyle === 'vertical') || (this.props.layoutStyle === 'horizontal')) {
      modifiedOptions = {
        layout: {
          randomSeed: this.props.layoutRandomSeed,
          hierarchical: {
            enabled: false,
          },
        },
        physics: false,
      };
    }

    return { ...graphOptions, ...modifiedOptions };
  }


  // Method to add requisite tags to graph definition JSON before passing to vis.js
  addTagsToGraph(graph) {
    // Adds vis.js specific tags primarily to style graph as desired
    const g = _.cloneDeep(graph);
    const nodeTypeColorMap = getNodeTypeColorMap(); // We could put standardized concepts here

    // nodes -> node_list
    const isVert = this.props.layoutStyle === 'vertical';
    const isHorz = this.props.layoutStyle === 'horizontal';
    g.nodes = g.node_list.map((n, i) => {
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor },
      };
      n.label = n.description;

      if (isVert) {
        n.x = 100; // Position nodes vertically
        n.y = i * 100;
      }
      if (isHorz) {
        n.y = 100; // Position nodes horizontally
        n.x = i * 500;
      }
      return n;
    });

    // g.edges = g.edges.map(e => ({ ...e, ...{ label: e.scoring.spect_weight.toFixed(2) } }));
    // Add parameters to edges like curvature if Support edge
    const rng = seedrandom('fixed seed'); // Set seed so re-renders look the same
    // edges -> edge_list
    g.edges = g.edge_list.map((e) => {
      let edgeParams = {};
      let label = e.type;
      if (e.type !== 'literature_co-occurrence') {
        edgeParams = {
          smooth: {type: 'curvedCW', roundness: 0 },
          width: 2,
        };

      } else {
        label = '';
        if (('publications' in e) && Array.isArray(e.publications) && e.publications.length > 0) {
          label = String(e.publications.length);
        }
        edgeParams = {
          smooth: { type: rng() < 0.5 ? 'curvedCW' : 'curvedCCW', roundness: 0.6 },
          color: this.styles.supportEdgeColors,
          dashes: [2, 4],
          width: 1,
          hoverWidth: 0,
          physics: false,
          
        };
      }
      e.from = e.source_id;
      e.to = e.target_id;

      // const toId = e.source_id;
      // const fromId = e.target_id;

      // let label = e.scoring.num_pubs !== 0 ? `Pubs: ${e.scoring.num_pubs}` : '';
      // if ((typeof toId === 'string' && toId.startsWith('NAME.')) || (typeof fromId === 'string' && e.from.startsWith('NAME.'))) {
      //   label = '';
      // }
      // title: createTooltip(e)
      return { ...e, ...{ label, ...edgeParams } };
    });
    if (!this.props.showSupport) {
      g.edges = g.edges.filter(e => e.type !== 'literature_co-occurrence');
    }

    return g;
  }

  render() {
    let graph = this.props.subgraph;

    const isValid = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'node_list'));
    if (isValid) {
      graph = this.addTagsToGraph(graph);
    }
    const graphOptions = this.getGraphOptions();

    return (
      <div>
        { isValid &&
        <div>
          <div style={{ fontFamily: 'Monospace' }}>
            <Graph
              key={shortid.generate()} // Forces component remount
              graph={graph}
              style={{ width: '100%' }}
              options={graphOptions}
              events={{ click: this.clickCallback }}
              getNetwork={(network) => { this.network = network; }} // Store network reference in the component
            />
          </div>
        </div>
        }
      </div>
    );
  }
}

SubGraphViewer.defaultProps = {
  layoutRandomSeed: 0,
  layoutStyle: 'auto',
  height: 500,
  showSupport: false,
  callbackOnGraphClick: () => {},
};

export default SubGraphViewer;
