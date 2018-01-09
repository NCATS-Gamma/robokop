'use babel';

import React from 'react';
import { ButtonGroup, Button, Glyphicon, PanelGroup, Panel } from 'react-bootstrap';
import ProtocopSubGraphViewer from './ProtocopSubGraphViewer';
import ProtocopSubGraphExplorer from './ProtocopSubGraphExplorer';

const shortid = require('shortid');

class ProtocopRankingBrowser extends React.Component {
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
      selectedSubGraphEdge: null,
    };

    this.updateSelectedSubGraphIndex = this.updateSelectedSubGraphIndex.bind(this);
    this.onGraphClick = this.onGraphClick.bind(this);
  }
  componentWillReceiveProps(newProps) {
    this.setState({ selectedSubGraphIndex: 0, selectedSubGraphEdge: null });
  }

  onGraphClick(event) {
    if (event.edges.length !== 0) { // Clicked on an Edge
      this.setState({ selectedSubGraphEdge: event.edges[0] });
    } else { // Reset things since something else was clicked
      this.setState({ selectedSubGraphEdge: null });
    }
  }
  getListGroup() {
    const listEntries = this.props.ranking.map((s, ind) => {
      const isActive = ind === this.state.selectedSubGraphIndex;
      let bsStyle = 'default';
      if (isActive) {
        bsStyle = 'primary';
      }
      const scoreProp = s.score;
      let cScore = 0;
      if (!(scoreProp == null)) {
        cScore = scoreProp.rank_score.toFixed(4);
      }
      return (
        // <ListGroupItem key={shortid.generate()} onClick={() => this.updateSelectedSubGraphIndex(ind)} active={isActive}>
        <Panel
          key={shortid.generate()}
          bsStyle={bsStyle}
          header={`${ind + 1} - ${s.info.name}`}
          onClick={() => this.updateSelectedSubGraphIndex(ind)}
          style={{ cursor: 'pointer' }}
        >
          {`Score: ${cScore}`}
        </Panel>
        // </ListGroupItem>
      );
    });

    return (
      <PanelGroup key={shortid.generate()}>
        {listEntries}
      </PanelGroup>
    );
  }
  updateSelectedSubGraphIndex(ind) {
    this.setState({ selectedSubGraphIndex: ind, selectedSubGraphEdge: null });
  }
  render() {
    return (
      <div id="ProtocopRanking_Explorer" className="col-md-12">
        <div className="row" style={this.styles.mainContent}>
          <div className={'col-md-2'} style={this.styles.listGroup}>
            {this.getListGroup()}
          </div>
          <div className={'col-md-3'} style={this.styles.graph}>
            <ProtocopSubGraphViewer
              subgraph={this.props.ranking[this.state.selectedSubGraphIndex]}
              callbackOnGraphClick={this.onGraphClick}
            />
          </div>
          <div className="col-md-7" style={this.styles.explorer}>
            <ProtocopSubGraphExplorer
              subgraphs={this.props.ranking}
              selectedSubgraphIndex={this.state.selectedSubGraphIndex}
              selectedEdge={this.state.selectedSubGraphEdge}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default ProtocopRankingBrowser;
