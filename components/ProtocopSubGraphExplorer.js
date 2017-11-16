'use babel';

import React from 'react';
import { Panel, Tabs, Tab, Button, Glyphicon, ListGroup, ListGroupItem } from 'react-bootstrap';

import ProtocopPubmedEntry from './ProtocopPubmedEntry';

const shortid = require('shortid');

class ProtocopSubGraphExplorer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      liked: false,
      tabKey: 1,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.callbackLike = this.callbackLike.bind(this);

    this.generateGeneralEdgeContent = this.generateGeneralEdgeContent.bind(this);
    this.generateChemotextContent = this.generateChemotextContent.bind(this);
    this.generateChemotext2Content = this.generateChemotext2Content.bind(this);
    this.generateCdwContent = this.generateCdwContent.bind(this);
  }
  componentWillReceiveProps(newProps) {
    let newLike = false;
    if (Object.prototype.hasOwnProperty.call(newProps.subgraphs[newProps.selectedSubgraphIndex], 'liked')) {
      newLike = newProps.subgraphs[newProps.selectedSubgraphIndex].liked;
    }
    this.setState({ liked: newLike });
  }
  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }
  callbackLike() {
    this.props.subgraphs[this.props.selectedSubgraphIndex].liked = !this.state.liked;
    this.setState({ liked: !this.state.liked });
  }
  generateGeneralEdgeContent(subgraph, edgeId) {
    const edge = subgraph.edges.filter(e => e.id === edgeId)[0];
    const nodeFrom = subgraph.nodes.filter(n => n.id === edge.from)[0];
    const nodeTo = subgraph.nodes.filter(n => n.id === edge.to)[0];

    const edgeSource = edge.reference;
    let finalFragment = <p>{`Link established using ${edgeSource}`}</p>;
    if (!(edge.type === 'Result')) {
      finalFragment = <p>{'Support Edge'}</p>;
    }
    return (
      <div key={shortid.generate()} style={{ paddingBottom: '5px' }}>
        <h3>{nodeFrom.name} <Glyphicon glyph={'arrow-right'} /> {nodeTo.name}</h3>
        <p>{nodeFrom.id} <Glyphicon glyph={'arrow-right'} /> {nodeTo.id}</p>
        {finalFragment}
        <br />
      </div>
    );
  }
  generateChemotextContent(subgraph, edgeId) {
    const edge = subgraph.edges.filter(e => e.id === edgeId)[0];
    
    // console.log(edgeId)
    // console.log(edge)
    // console.log(subgraph.nodes)
    // //console.log(nodeTo)

    const publications = edge.publications;
    let publicationString = 'No publications were';
    if (publications.length === 1) {
      publicationString = `${publications.length} publication was`;
    } else if (publications.length > 0) {
      publicationString = `${publications.length} publications were`;
    }

    const headerFragment = [
      <div key={shortid.generate()} style={{ paddingBottom: '5px' }}>
        <h4>{`${publicationString} found to support this edge.`}</h4>
      </div>,
    ];

    let publicationsFragment = [];
    if (publications.length > 0) {
      let pubsTruncated = false;
      const nTruncPubs = 50;
      if (publications.length > nTruncPubs) {
        pubsTruncated = true;
        publications.splice(nTruncPubs, publications.length - nTruncPubs);
      }
      
      const publicationsList = publications.map(p => (
        <ListGroupItem key={shortid.generate()}>
          <ProtocopPubmedEntry key={shortid.generate()} pmid={p} />
        </ListGroupItem>
      ));

      let publicationHeader = [];
      if (pubsTruncated) {
        publicationHeader = <h5>{`${nTruncPubs} publications are shown below.`}</h5>;
      }
      const panelId = shortid.generate();
      publicationsFragment = [
        <div key={shortid.generate()}>
          {publicationHeader}
          <Panel key={panelId} header={'Supporting Publications'} eventKey={panelId}>
            <ListGroup key={shortid.generate()} fill>
              {publicationsList}
            </ListGroup>
          </Panel>
        </div>,
      ];
    }

    return (
      <div className="row" key={shortid.generate()}>
        <div className="col-md-12">
          <div className="row">
            <div className="col-md-12">
              {headerFragment}
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              {publicationsFragment}
            </div>
          </div>
        </div>
      </div>
    );

    // console.log(subgraph);
    // console.log(edge);
    // console.log(nodeFrom);
    // console.log(nodeTo);
    // return (<h4>{'Chemotext Information would go here'} {edgeId} </h4>);
  }
  generateChemotext2Content(subgraph, edgeId) {
    const edge = subgraph.edges.filter(e => e.id === edgeId)[0];
    const sim = edge.similarity;
    let simMeasure = null;
    let noSim = false;
    if (sim == null || (Array.isArray(sim) && sim.length === 0)) {
      noSim = true;
    } else if (Array.isArray(sim)) {
      simMeasure = sim[0];
    } else {
      simMeasure = sim;
    }
    
    return (
      <div className="row" key={shortid.generate()}>
        <div className="col-md-12">
          {noSim &&
            <h4>{'No text similarity measurement was available using ChemoText 2'}</h4>
          }
          {!noSim &&
            <h4>{`ChemoText 2 returned a similarity measure of ${simMeasure.toFixed(4)}`}</h4>
          }
        </div>
      </div>
    );
  }
  generateCdwContent(subgraph, edgeId) {
    return (<h4>{'CDW Information would go here'} {edgeId}</h4>);
  }
  render() {
    const edge = this.props.selectedEdge;
    let splash = false;
    if (edge == null) {
      splash = true;
    }

    let topContent = (
      <div className="row">
        <div className="col-md-12">
          <h3>No answer graphs were found to match the specified query.</h3>
        </div>
      </div>
    );

    // Default content for tabs.
    let generalEdgeContent = (<h4>{'No content yet.'}</h4>);
    let chemotextContent = (<h4>{'No content yet.'}</h4>);
    let chemotext2Content = (<h4>{'No content yet.'}</h4>);
    let cdwContent = (<h4>{'No content yet.'}</h4>);

    const subgraphs = this.props.subgraphs;
    if (!(subgraphs == null) && Array.isArray(subgraphs)) {
      const subgraph = this.props.subgraphs[this.props.selectedSubgraphIndex];
      const subgraphName = subgraph.info.name;

      const nEdges = subgraph.edges.length;
      const nEdgesSupport = subgraph.edges.reduce((total, e) => total + !(e.type === 'Result'), 0);
      const nEdgesPrimary = nEdges - nEdgesSupport;

      const edgesPrimary = subgraph.edges.filter(e => (e.type === 'Result'));
      const edgesSupport = subgraph.edges.filter(e => !(e.type === 'Result'));
      const nPubsPrimary = edgesPrimary.reduce((total, e) => total + e.publications.length, 0);
      const nPubsSupport = edgesSupport.reduce((total, e) => total + e.publications.length, 0);

      let nPubsPrimaryString = 'No primary publications were found';
      if (nPubsPrimary === 1) {
        nPubsPrimaryString = '1 primary publication was found';
      } else if (nPubsPrimary > 1) {
        nPubsPrimaryString = `${nPubsPrimary} primary publications were found`;
      }

      let nPubsSupportString = 'No supporting publications were found';
      if (nPubsSupport === 1) {
        nPubsSupportString = '1 supporting publication was found';
      } else if (nPubsSupport > 1) {
        nPubsSupportString = `${nPubsSupport} supporting publications were found`;
      }

      const isLiked = this.state.liked;
      let buttonStyle = 'default';
      if (isLiked) {
        buttonStyle = 'primary';
      }

      topContent = (
        <div>
          <div className="row">
            <div className="col-md-8">
              <h2>Answer {this.props.selectedSubgraphIndex + 1} of {this.props.subgraphs.length}</h2>
              <h5>{subgraphName}</h5>
            </div>
            <div className="col-md-4 pull-right" style={{ paddingTop: '10px' }}>
              <Button bsClass={`pull-right btn btn-${buttonStyle}`} bsSize="small" active={isLiked} onClick={this.callbackLike}>
                {'I Like this Answer '} <Glyphicon glyph="thumbs-up" />
              </Button>
            </div>
          </div>
          <div className="row" style={{ minHeight: '100px' }}>
            <div className="col-md-12">
              {/* <p>{subgraph.info.nameLong}</p> */}
              <p>{`${nEdgesPrimary} primary edges and ${nEdgesSupport} support edges were found.`}</p>
              <p>{`${nPubsPrimaryString} to justify this answer.`}</p>
              <p>{`${nPubsSupportString} to justify this answer.`}</p>
              <p><bold>{'Score Report:'}</bold></p>
              <ul>
                <li>{`Publication confidence: ${subgraph.score.score_prod.toFixed(4)}`}</li>
                <li>{`Graph diffusion based informativeness: ${subgraph.score.score_naga.toFixed(4)}`}</li>
                <li>{`Comparative supportedness: ${subgraph.score.score_hit.toFixed(4)}`}</li>
                <li>{`Combined score: ${subgraph.score.rank_score.toFixed(4)}`}</li>
              </ul>
            </div>
          </div>
        </div>
      );
      if (!splash) {
        // Update content tabs.
        generalEdgeContent = this.generateGeneralEdgeContent(subgraph, edge);
        chemotextContent = this.generateChemotextContent(subgraph, edge);
        chemotext2Content = this.generateChemotext2Content(subgraph, edge);
        cdwContent = this.generateCdwContent(subgraph);
      }
    }

    return (
      <div id="Protocop_subgraphexplorer">
        <div>
          {topContent}
        </div>
        <div className="row">
          <div className="col-md-12" style={{ paddingTop: '5px' }}>
            { splash &&
              <h4> Click on an edge in the answer graph for more information.</h4>
            }
            { !splash &&
              <div>
                {generalEdgeContent}
                <Tabs activeKey={this.state.tabKey} onSelect={this.handleTabSelect} id="ProtocopSubGraphTabs">
                  <Tab eventKey={1} title="ChemoText - Publications">
                    <div style={{ paddingLeft: '10px', paddingRight: '10px' }}>
                      {chemotextContent}
                    </div>
                  </Tab>
                  <Tab eventKey={2} title="ChemoText 2 - Text Similarity">
                    <div style={{ paddingLeft: '10px', paddingRight: '10px' }}>
                      {chemotext2Content}
                    </div>
                  </Tab>
                  <Tab eventKey={3} title="CDW">
                    <div style={{ paddingLeft: '10px', paddingRight: '10px' }}>
                      {cdwContent}
                    </div>
                  </Tab>
                </Tabs>
              </div>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default ProtocopSubGraphExplorer;
