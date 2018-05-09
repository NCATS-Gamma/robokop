import React from 'react';
import getNodeTypeColorMap from '../questionNew/ColorUtils';

const Graph = require('react-graph-vis').default;
const shortid = require('shortid');
const _ = require('lodash');
const seedrandom = require('seedrandom');

class SubGraphViewer extends React.Component {
  constructor(props) {
    super(props);

    this.addTagsToGraph = this.addTagsToGraph.bind(this);
    this.setNetworkCallbacks = this.setNetworkCallbacks.bind(this);
    // this.clickCallback = event => this.props.callbackOnGraphClick(event);

    this.styles = {
      supportEdgeColors: {
        color: '#aaa',
        highlight: '#3da4ed',
        hover: '#444',
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
    this.network.on('afterDrawing', () => this.network.fit());
    this.network.on('doubleClick', () => this.network.fit());
    this.network.on('zoom', () => this.network.off('afterDrawing'));
    this.network.on('dragStart', () => this.network.off('afterDrawing'));
  }

  // Method to add requisite tags to graph definition JSON before passing to vis.js
  addTagsToGraph(graph) {
    // Generate innerHTML string for tooltip contents for a given edge
<<<<<<< HEAD

    // function createTooltip(edge) {
    //   const defaultNames = {
    //     num_pubs: { name: 'Publications', precision: 0 },
    //     // pub_weight: { name: 'Confidence', precision: 4 },
    //     spect_weight: { name: 'Support Confidence', precision: 4 },
    //     edge_proba: { name: 'Combined Weight', precision: 4 },
    //     // proba_query: { name: 'Importance', precision: 4 },
    //     // proba_info: { name: 'Informativeness', precision: 4 },
    //   };
    //   // const defaultOrder = ['num_pubs', 'pub_weight', 'spect_weight', 'edge_proba'];
    //   const defaultOrder = ['num_pubs', 'spect_weight', 'edge_proba'];
    //   const innerHtml = defaultOrder.reduce((sum, k) => {
    //     if (_.hasIn(edge.scoring, k)) {
    //       return (
    //         `${sum}
    //         <div>
    //           <span class="field-name">${defaultNames[k].name}: </span>
    //           <span class="field-value">${edge.scoring[k].toFixed(defaultNames[k].precision)}</span>
    //         </div>`
    //       );
    //     }
    //     return sum;
    //   }, '');
    //   let edgeTypeString = 'Supporting';
    //   if (edge.type === 'Result') {
    //     edgeTypeString = 'Primary';
    //   } 
    //   if (edge.type === 'Lookup') {
    //     edgeTypeString = 'Lookup';
    //   } 
    //   return (
    //     `<div class="vis-tooltip-inner">
    //       <div><span class="title">${edgeTypeString} Edge</span></div>
    //       ${innerHtml}
    //     </div>`
    //   );
    // }

=======
    function createTooltip(edge) {
      const defaultNames = {
        num_pubs: { name: 'Publications', precision: 0 },
        // pub_weight: { name: 'Confidence', precision: 4 },
        spect_weight: { name: 'Support Confidence', precision: 4 },
        edge_proba: { name: 'Combined Weight', precision: 4 },
        // proba_query: { name: 'Importance', precision: 4 },
        // proba_info: { name: 'Informativeness', precision: 4 },
      };
      // const defaultOrder = ['num_pubs', 'pub_weight', 'spect_weight', 'edge_proba'];
      const defaultOrder = ['num_pubs', 'spect_weight', 'edge_proba'];
      const innerHtml = defaultOrder.reduce((sum, k) => {
        if (_.hasIn(edge.scoring, k)) {
          return (
            `${sum}
            <div>
              <span class="field-name">${defaultNames[k].name}: </span>
              <span class="field-value">${edge.scoring[k].toFixed(defaultNames[k].precision)}</span>
            </div>`
          );
        }
        return sum;
      }, '');
      let edgeTypeString = 'Primary';
      if (edge.type === 'Support') {
        edgeTypeString = 'Supporting';
      }
      return (
        `<div class="vis-tooltip-inner">
          <div><span class="title">${edgeTypeString} Edge</span></div>
          ${innerHtml}
        </div>`
      );
    }
>>>>>>> 6001e2117e08710a83c41766cc3c85c0ec783a5c
    // Adds vis.js specific tags primarily to style graph as desired
    const g = _.cloneDeep(graph);
    const nodeTypeColorMap = getNodeTypeColorMap(); // We could put standardized concepts here

    // nodes -> node_list
    g.nodes = g.node_list.map((n, i) => {
      const backgroundColor = nodeTypeColorMap(n.type);
      n.color = {
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor },
      };
      n.label = n.description;
      // n.x = 100; // Position nodes vertically
      // n.y = i * 100;
      return n;
    });

    // g.edges = g.edges.map(e => ({ ...e, ...{ label: e.scoring.spect_weight.toFixed(2) } }));
    // Add parameters to edges like curvature if Support edge
    const rng = seedrandom('fixed seed'); // Set seed so re-renders look the same
    // edges -> edge_list
    g.edges = g.edge_list.map((e) => {
      let edgeParams = {};
      if (e.type !== 'Support') {
        edgeParams = { smooth: { type: 'curvedCW', roundness: 0 }};
      } else {
        edgeParams = {
          smooth: { type: rng() < 0.5 ? 'curvedCW' : 'curvedCCW', roundness: 0.6 },
          color: this.styles.supportEdgeColors,
          dashes: [2, 4],
        };
      }

      const label = e.type;
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
    return g;
  }

  render() {
    let graph = this.props.subgraph;

    const isValid = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'node_list'));
    if (isValid) {
      graph = this.addTagsToGraph(graph);
    }

    return (
      <div>
        { isValid &&
        <div>
          <div style={{ fontFamily: 'Monospace' }}>
            <Graph
              key={shortid.generate()} // Forces component remount
              graph={graph}
              style={{ width: '100%' }}
              options={this.graphOptions}
              getNetwork={(network) => { this.network = network; }} // Store network reference in the component
            />
          </div>
        </div>
        }
      </div>
    );
  }
}

// events={{ click: this.clickCallback }}

export default SubGraphViewer;
