import React from 'react';
import { ButtonGroup, Button, Glyphicon, PanelGroup, Panel } from 'react-bootstrap';
// import ProtocopRankingSelectorGraph from './ProtocopRankingSelectorGraph';
import SubGraphViewer from './SubGraphViewer';
import SubGraphInfo from './SubGraphInfo';

const shortid = require('shortid');

class AnswersetInteractive extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      mainContent: {
        height: '70vh',
        border: '1px solid #d1d1d1',
        overflow: 'hidden',
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
      },
      listGroup: {
        paddingLeft: '2px',
        paddingRight: '2px',
        height: '100%',
        overflow: 'auto',
      },
      graph: {
        paddingLeft: '0',
        paddingRight: '0',
        height: '100%',
        overflow: 'auto',
      },
      explorer: {
        height: '100%',
        overflow: 'auto',
      },
    };
    this.state = {
      selectedSubGraphIndex: 0,
      selectedSubGraphPossibilities: [],
      selectedSubGraphEdge: null,
      nodeSelection: [],
    };

    this.initializeNodeSelection = this.initializeNodeSelection.bind(this);
    this.handleNodeSelectionChange = this.handleNodeSelectionChange.bind(this);
    this.onSelectionCallback = this.onSelectionCallback.bind(this);
    this.onGraphClick = this.onGraphClick.bind(this);
  }
  componentDidMount() {
    // this.updateSelectedSubGraphIndex(0);
    this.initializeNodeSelection();
  }
  componentWillReceiveProps(newProps) {
    // this.setState({ selectedSubGraphIndex: 0, selectedSubGraphEdge: null });
    this.initializeNodeSelection();
  }
  initializeNodeSelection() {
    const nodeSelection = this.props.ranking[0].nodes.map(n => null);
    this.handleNodeSelectionChange(nodeSelection);
    this.setState({ nodeSelection });
  }
  handleNodeSelectionChange(nodeSelection) {
    // find all paths such that nodes match selection template
    const isKept = this.props.answers.map(s => s.nodes.reduce((keep, n, ind) => keep && ((nodeSelection[ind] == null) || (nodeSelection[ind] === n.id)), true));

    // convert isKept into ranked lists of nodes
    // loop through path positions
    const subgraphPossibilities = this.props.answers[0].nodes.map((n, ind) => {
      // loop through paths
      const theseNodes = this.props.answers.map(s => {
        // extract node at position
        const n = s.nodes[ind];
        n.score = s.score.rank_score;
        return n;
        // filter out user-constrained nodes
      }).filter((id, ind2) => isKept[ind2]);
      // get node ids
      const nodeIds = theseNodes.map(n => n.id);
      // keep first occurrence of each node
      return theseNodes.filter((val, ind3) => nodeIds.indexOf(val.id) === ind3);
    //   return theseNodes.filter((val, ind3) => nodeNames.indexOf(val.name) === ind3);
    });

    // then update the selectedSubGraphIndex to be the 'highest' one left
    const selectedSubGraphIndex = isKept.indexOf(true);

    if (selectedSubGraphIndex !== this.state.selectedSubGraphIndex) {
      this.setState({ selectedSubGraphEdge: null });
    }

    this.setState({ selectedSubGraphIndex, selectedSubGraphPossibilities: subgraphPossibilities });

  }
  onSelectionCallback(index, selectedOption){
    const nodeSelection = this.state.nodeSelection;
    if (selectedOption == null) {nodeSelection[index] = null}
    else {nodeSelection[index] = selectedOption.value}
    this.handleNodeSelectionChange(nodeSelection);
    this.setState({ nodeSelection });
  }
  onGraphClick(event) {
    if (event.edges.length !== 0) { // Clicked on an Edge
      this.setState({ selectedSubGraphEdge: event.edges[0] });
    } else { // Reset things since something else was clicked
      this.setState({ selectedSubGraphEdge: null });
    }
  }
  render() {
    return (
      <div id="ProtocopRanking_Explorer" className="col-md-12">
        <div className="row" style={this.styles.mainContent}>
          <div className={'col-md-3'} style={this.styles.graph}>
            {/* <ProtocopRankingSelectorGraph
              subgraph={this.props.answers[this.state.selectedSubGraphIndex]}
              subgraphPossibilities={this.state.selectedSubGraphPossibilities}
              onSelectionCallback={this.onSelectionCallback}
            /> */}
          </div>
          <div className={'col-md-3'} style={this.styles.graph}>
            <SubGraphViewer
              subgraph={this.props.answers[this.state.selectedSubGraphIndex]}
              callbackOnGraphClick={this.onGraphClick}
            />
          </div>
          <div className={'col-md-6'} style={this.styles.explorer}>
            <SubGraphInfo
              subgraphs={this.props.answers}
              selectedSubgraphIndex={this.state.selectedSubGraphIndex}
              selectedEdge={this.state.selectedSubGraphEdge}
            />
          </div>
          {/* <div className="col-md-4" style={this.styles.explorer}>
            {'Graph Info Goes Here.'}
          </div> */}
        </div>
      </div>
    );
  }
}

export default AnswersetInteractive;
