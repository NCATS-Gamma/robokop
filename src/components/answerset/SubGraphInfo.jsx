import React from 'react';
import { Panel, Tabs, Tab, Button, Glyphicon, ListGroup, ListGroupItem } from 'react-bootstrap';

import PubmedEntry from '../shared/PubmedEntry';

const shortid = require('shortid');
const _ = require('lodash');

class SubGraphInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: 1,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);

    this.generateGeneralEdgeContent = this.generateGeneralEdgeContent.bind(this);
    this.generateChemotextContent = this.generateChemotextContent.bind(this);
    this.generateChemotext2Content = this.generateChemotext2Content.bind(this);
    this.generateCdwContent = this.generateCdwContent.bind(this);
  }
  componentWillReceiveProps(newProps) {
    // used to initialize "liked" here
  }
  handleTabSelect(tabKey) {
    this.setState({ tabKey });
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
    
    const publications = _.cloneDeep(edge.publications);
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
          <PubmedEntry key={shortid.generate()} pmid={p} />
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

    return ([
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
      </div>,
      publications.length>0,
    ]);
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

    return ([
      <div className="row" key={shortid.generate()}>
        <div className="col-md-12">
          {noSim &&
            <h4>{'No text similarity measurement was available using ChemoText 2'}</h4>
          }
          {!noSim &&
            <h4>{`ChemoText 2 returned a similarity measure of ${simMeasure.toFixed(4)}`}</h4>
          }
        </div>
      </div>, 
      !noSim,
    ]
    );
  }
  generateCdwContent(subgraph, edgeId) {
    const edge = subgraph.edges.filter(e => e.id === edgeId)[0];
    const cdw = edge.cdw;
    const hasData = !(cdw == null) && !_.isEmpty(cdw);
    if (!hasData) {
      return [(<h4>{'No CDW information found for this edge.'}</h4>), false];
    }

    const nodeFrom = subgraph.nodes.filter(n => n.id === edge.from)[0];
    const nodeTo = subgraph.nodes.filter(n => n.id === edge.to)[0];

    return ([
      <div>
        <h4>{'Carolina Data Warehouse results:'}</h4>
        <ul>
          <li>{`Number of cases with ${nodeFrom.name}: ${cdw.source_counts}`}</li>
          <li>{`Number of cases with ${nodeTo.name}: ${cdw.target_counts}`}</li>
          <li>{`Number of cases with both: ${cdw.shared_counts}`}</li>
          <li>{`Expected number of cases with both (assuming independence): ${cdw.expected_counts.toFixed(2)}`}</li>
        </ul>
      </div>, true]
    );
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
    let hasChemotext = false;
    let chemotext2Content = (<h4>{'No content yet.'}</h4>);
    let hasChemotext2 = false;
    let cdwContent = (<h4>{'No content yet.'}</h4>);
    let hasCdw = false;

    const subgraphs = this.props.subgraphs;
    if (!(subgraphs == null) && Array.isArray(subgraphs)) {
      const subgraph = this.props.subgraphs[this.props.selectedSubgraphIndex];
      const subgraphName = 'TODO: create short name'; //subgraph.info.name;

      const nEdgesSupport = subgraph.edges.reduce((total, e) => total + (e.type === 'Support'), 0);
      const nEdgesPrimary = subgraph.edges.reduce((total, e) => total + (e.type === 'Result'), 0);

      const edgesPrimary = subgraph.edges.filter(e => (e.type === 'Result'));
      const edgesSupport = subgraph.edges.filter(e => (e.type === 'Support'));
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

      topContent = (
        <div>
          <div className="row">
            <div className="col-md-12">
              <h2>Answer {this.props.selectedSubgraphIndex + 1} of {this.props.subgraphs.length}</h2>
              <h5>{subgraphName}</h5>
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
        const chemotextOutput = this.generateChemotextContent(subgraph, edge);
        chemotextContent = chemotextOutput[0];
        hasChemotext = chemotextOutput[1];
        const chemotext2Output = this.generateChemotext2Content(subgraph, edge);
        chemotext2Content = chemotext2Output[0];
        hasChemotext2 = chemotext2Output[1];
        const cdwContentOutput = this.generateCdwContent(subgraph, edge);
        cdwContent = cdwContentOutput[0];
        hasCdw = cdwContentOutput[1];
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
              <h4>{'Click on an edge in the answer graph for more information.'}</h4>
            }
            { !splash &&
              <div>
                {generalEdgeContent}
                <Tabs activeKey={this.state.tabKey} onSelect={this.handleTabSelect} id="ProtocopSubGraphTabs">
                  <Tab eventKey={1} title="ChemoText - Publications" disabled={!hasChemotext}>
                    <div style={{ paddingLeft: '10px', paddingRight: '10px' }}>
                      {chemotextContent}
                    </div>
                  </Tab>
                  <Tab eventKey={2} title="ChemoText 2 - Text Similarity" disabled={!hasChemotext2}>
                    <div style={{ paddingLeft: '10px', paddingRight: '10px' }}>
                      {chemotext2Content}
                    </div>
                  </Tab>
                  <Tab eventKey={3} title="CDW" disabled={!hasCdw}>
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

export default SubGraphInfo;
