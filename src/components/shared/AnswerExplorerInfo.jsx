import React from 'react';

import { Row, Col, Panel } from 'react-bootstrap';
import FaDownload from 'react-icons/lib/fa/download';

import SubGraphViewer from './SubGraphViewer';
import PubmedList from './PubmedList';

import curieUrls from '../util/curieUrls';

const shortid = require('shortid');

class AnswerExplorerInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedEdge: {},
      selectedEdgeId: null,
      selectedNodeId: null,
      subgraph: { nodes: [], edges: [] },
      disbleGraphClick: false,
      downloadingPubs: false,
    };

    this.onGraphClick = this.onGraphClick.bind(this);
  }

  componentDidMount() {
    this.syncPropsAndState(this.props);
  }

  onGraphClick(event) {
    if (this.state.disbleGraphClick) {
      return;
    }

    const newState = { selectedEdgeId: null, selectedNodeId: null, selectedEdge: {} };
    if (event.edges.length !== 0) { // Clicked on an Edge
      newState.selectedEdgeId = event.edgeObjects[0].edgeIdFromKG;
      newState.selectedEdge = event.edgeObjects[0];
    } else if (event.nodes.length !== 0) { // Clicked on a node
      newState.selectedNodeId = event.nodes[0];
    }
    this.setState(newState);
  }
  getPublicationsFrag() {
    let publicationListFrag = <div><p>Click on edge above to see a list of publications.</p></div>;
    let publicationsTitle = 'Publications';

    let publications = [];
    if (this.state.selectedEdgeId !== null) {
      // Edge is selected
      let edge = this.state.subgraph.edges.find(e => e.id === this.state.selectedEdgeId);
      if (typeof edge === 'undefined') {
        edge = this.state.subgraph.edges.find(e => e.edgeIdFromKG === this.state.selectedEdgeId);
      }
      if (typeof edge === 'undefined') {
        console.log('Couldn\'t find this edge', this.state.selectedEdgeId, this.state.subgraph.edges);
        return (
          <div>
            <h4 style={{ marginTop: '15px' }}>
              An error was encountered fetching publication information.
            </h4>
          </div>
        );
      }

      const sourceNode = this.state.subgraph.nodes.find(n => n.id === edge.source_id);
      const targetNode = this.state.subgraph.nodes.find(n => n.id === edge.target_id);
      if ('publications' in edge && Array.isArray(edge.publications)) {
        ({ publications } = edge);
      }
      publicationsTitle = `${publications.length} Publications for ${sourceNode.name} and ${targetNode.name}`;
      publicationListFrag = <PubmedList publications={publications} />;
    } else if (this.state.selectedNodeId) {
      // Node is selected
      const node = this.state.subgraph.nodes.find(n => n.id === this.state.selectedNodeId);
      if ('publications' in node && Array.isArray(node.publications)) {
        ({ publications } = node);
      }
      publicationsTitle = `${publications.length} Publications for ${node.name}`;
      publicationListFrag = <PubmedList publications={publications} />;
    }

    const downloadCallback = () => this.setState({ downloadingPubs: true }, () => this.downloadPublicationsInfo(publications));
    const showDownload = publications.length >= 1;

    const cursor = this.state.downloadingPubs ? 'progress' : 'pointer';
    const activeCallback = this.state.downloadingPubs ? () => { } : downloadCallback;
    const downloadTitle = this.state.downloadingPubs ? 'Downloading Please Wait' : 'Download Publications';
    const downloadColor = this.state.downloadingPubs ? '#333' : '#000';
    return (
      <Panel style={{ marginTop: '15px' }}>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            {publicationsTitle}
            <div className="pull-right">
              <div style={{ position: 'relative' }}>
                {showDownload &&
                  <div style={{ position: 'absolute', top: -3, right: -8 }}>
                    <span style={{ fontSize: '22px', color: downloadColor }} title={downloadTitle}>
                      <FaDownload onClick={activeCallback} style={{ cursor }} />
                    </span>
                  </div>
                }
              </div>
            </div>
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ padding: 0 }}>
          {publicationListFrag}
        </Panel.Body>
      </Panel>
    );
  }
  getNodeInfoFrag(n) {
    if (!n || !('name' in n)) {
      return (<div />);
    }

    const urls = curieUrls(n.id);
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            {n.name}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ minHeight: '100px' }}>
          <h5>
            {n.type}
          </h5>
          <h5>
            {n.id}
          </h5>
          {
            urls.map(link => <span key={shortid.generate()}><a href={link.url} target="_blank">{link.label}</a> &nbsp; </span>)
          }
        </Panel.Body>
      </Panel>
    );
  }

  getEdgeInfoFrag(edge) {
    if (!edge) {
      return (<div />);
    }
    let origin = 'Unknown';
    const sourceToOriginString = source => source; // source.substr(0, source.indexOf('.'));

    if ('source_database' in edge) {
      if (Array.isArray(edge.source_database) && edge.source_database.length > 0) {
        origin = edge.source_database.map(source => <span key={shortid.generate()}>{sourceToOriginString(source)} &nbsp; </span>);
      } else {
        origin = sourceToOriginString(edge.source_database);
      }
    }
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            {edge.type}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ minHeight: '100px' }}>
          <h5>
            Established using:
            <p>
              {origin}
            </p>
          </h5>
        </Panel.Body>
      </Panel>
    );
  }

  syncPropsAndState(newProps) {
    const { graph, selectedEdge } = newProps;
    const nodes = graph.node_list.filter(n => ((n.id === selectedEdge.source_id) || (n.id === selectedEdge.target_id)));
    const nodeIds = nodes.map(n => n.id);
    const edges = graph.edge_list.filter(e => (nodeIds.includes(e.source_id) && nodeIds.includes(e.target_id)));

    const subgraph = { nodes, edges };
    this.setState({
      subgraph, selectedEdgeId: selectedEdge.edgeIdFromKG, selectedNodeId: null, selectedEdge,
    }, () => {
      this.getPublicationsFrag();
    });

    if (edges.length === 1) {
      this.setState({ disbleGraphClick: true });
    }
  }

  downloadPublicationsInfo(publications) {
    const defaultInfo = {
      id: '',
      title: 'Unable to fetch publication information',
      authors: [],
      journal: '',
      source: '',
      pubdate: '',
      url: '',
      doid: '',
    };
    const getInfo = (result, pmid, pmidNum) => {
      const paperInfo = result[pmidNum];
      const fetchedInfo = {
        id: pmid,
        title: paperInfo.title,
        authors: paperInfo.authors,
        journal: paperInfo.fulljournalname,
        source: paperInfo.source,
        pubdate: paperInfo.pubdate,
        url: `https://www.ncbi.nlm.nih.gov/pubmed/${pmidNum}/`,
        doid: paperInfo.elocationid,
      };
      return { ...defaultInfo, ...fetchedInfo };
    };

    const getPubmedInformation = (pmid) => {
      const pmidNum = pmid.substr(pmid.indexOf(':') + 1);
      const postUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
      const postData = {
        db: 'pubmed',
        id: pmidNum.toString(),
        version: '2.0',
        retmode: 'json',
      };

      return new Promise((resolve, reject) => $.post(postUrl, postData, response => resolve(response)).fail(response => reject(response)))
        .then(info => getInfo(info.result, pmid, pmidNum)).catch((err) => { console.log(err); return defaultInfo; });
    };

    Promise.all(publications.map((p, i) => new Promise(resolve => setTimeout(resolve, (i * 100) + 1)).then(() => getPubmedInformation(p)))).then((data) => {
      // Transform the data into a json blob and give it a url
      // const json = JSON.stringify(data);
      // const blob = new Blob([json], { type: 'application/json' });
      // const url = URL.createObjectURL(blob);

      const fields = ['url', 'title', 'journal', 'pubdate'];
      const replacer = (key, value) => { return value === null ? '' : value; };

      const csv = data.map(row => fields.map(f => JSON.stringify(row[f], replacer)).join(','));
      csv.unshift(fields.join(','));
      const csvText = csv.join('\n');

      const blob = new Blob([csvText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Create a link with that URL and click it.
      const a = document.createElement('a');
      a.download = 'publications.csv';
      a.href = url;
      a.click();
      a.remove();
    }).then(() => this.setState({ downloadingPubs: false }));
  }


  render() {
    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={12}>
              <SubGraphViewer
                height={200}
                subgraph={{ node_list: this.state.subgraph.nodes, edge_list: this.state.subgraph.edges }}
                layoutStyle="auto"
                layoutRandomSeed={1}
                showSupport
                varyEdgeSmoothRoundness
                callbackOnGraphClick={this.onGraphClick}
                concepts={this.props.concepts}
              />
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              {this.getNodeInfoFrag(this.state.subgraph.nodes[0])}
            </Col>
            <Col md={4}>
              {this.getEdgeInfoFrag(this.state.selectedEdge)}
            </Col>
            <Col md={4}>
              {this.getNodeInfoFrag(this.state.subgraph.nodes[1])}
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              {this.getPublicationsFrag()}
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}

export default AnswerExplorerInfo;
