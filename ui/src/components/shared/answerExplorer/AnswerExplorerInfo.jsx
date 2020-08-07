import React from 'react';

import { Row, Col, Panel } from 'react-bootstrap';
import { FaDownload } from 'react-icons/fa';

import AppConfig from '../../../AppConfig';
import config from '../../../config.json';

import SubGraphViewer from '../../../components/shared/graphs/SubGraphViewer';
import PubmedList from '../../../components/shared/pubmedList/PubmedList';

import curieUrls from '../../../utils/curieUrls';
import ctdUrls from '../../../utils/ctdUrls';
import getNodeTypeColorMap from '../../../utils/colorUtils';
import entityNameDisplay from '../../../utils/entityNameDisplay';

const shortid = require('shortid');

const nodeBlacklist = ['isSet', 'labels', 'label', 'equivalent_identifiers', 'type', 'id', 'degree', 'name', 'title', 'color', 'binding'];
const edgeBlacklist = ['binding', 'ctime', 'id', 'publications', 'source_database', 'source_id', 'target_id', 'type'];

class AnswerExplorerInfo extends React.Component {
  constructor(props) {
    super(props);

    this.appConfig = new AppConfig(config);

    this.state = {
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

  syncPropsAndState(newProps) {
    const { graph, selectedEdge } = newProps;
    const nodes = graph.nodes.filter(n => ((n.id === selectedEdge.source_id) || (n.id === selectedEdge.target_id)));
    const nodeIds = nodes.map(n => n.id);
    const edges = graph.edges.filter(e => (nodeIds.includes(e.source_id) && nodeIds.includes(e.target_id)));

    const subgraph = { nodes, edges };
    this.setState({
      subgraph, selectedEdgeId: selectedEdge.edgeIdFromKG, selectedNodeId: null,
    }, () => {
      this.getPublicationsFrag();
    });

    if (edges.length === 1) {
      this.setState({ disbleGraphClick: true });
    }
  }

  onGraphClick(event) {
    if (this.state.disbleGraphClick) {
      return;
    }

    const newState = { selectedEdgeId: null, selectedNodeId: null, selectedEdge: {} };
    if (event.edges.length !== 0) { // Clicked on an Edge
      newState.selectedEdgeId = event.edgeObjects[0].edgeIdFromKG;
      [newState.selectedEdge] = event.edgeObjects;
    } else if (event.nodes.length !== 0) { // Clicked on a node
      [newState.selectedNodeId] = event.nodes;
    }
    this.setState(newState);
  }

  getNodeInfoFrag(n) {
    if (!n || !('name' in n)) {
      return (<div />);
    }
    const edge = this.state.subgraph.edges.find(e => e.id === this.state.selectedEdgeId);
    const urls = curieUrls(n.id);
    if (edge.source_database.includes('ctd')) {
      const urlObj = ctdUrls(n.type, n.equivalent_identifiers);
      urls.push(urlObj);
    }
    const nodeTypeColorMap = getNodeTypeColorMap(this.props.concepts);
    const backgroundColor = nodeTypeColorMap(n.type);
    const extraFields = Object.keys(n).filter(property => !nodeBlacklist.includes(property));
    return (
      <Panel>
        <Panel.Heading style={{ backgroundColor }}>
          <Panel.Title componentClass="h3">
            {n.name}
            <div className="pull-right">
              {
                urls.map(link => <span key={shortid.generate()} style={{ margin: '0px 5px' }}><a href={link.url} target="_blank"><img src={link.iconUrl} alt={link.label} height={16} width={16} /></a></span>)
              }
            </div>
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ height: '100px', overflowY: 'auto' }}>
          <h5>
            type: {entityNameDisplay(n.type)}
          </h5>
          <h5>
            id: {n.id}
          </h5>
          {extraFields.map(property => (
            <h5 key={shortid.generate()}>
              {property}: {n[property].toString()}
            </h5>
          ))}
        </Panel.Body>
      </Panel>
    );
  }

  getEdgeInfoFrag(edgeId) {
    if (!edgeId) {
      return (<div />);
    }
    const edge = this.state.subgraph.edges.find(e => e.id === edgeId);

    const extraFields = Object.keys(edge).filter(property => !edgeBlacklist.includes(property));

    let origin = ['Unknown'];
    const sourceToOriginString = source => source; // source.substr(0, source.indexOf('.'));

    if ('source_database' in edge) {
      if (Array.isArray(edge.source_database) && edge.source_database.length > 0) {
        origin = edge.source_database.map(source => sourceToOriginString(source));
      } else {
        origin = [sourceToOriginString(edge.source_database)];
      }
    }
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            {edge.type}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ height: '100px', overflowY: 'auto' }}>
          <h5>
            Established using:
            <p>
              {origin.join(', ')}
            </p>
          </h5>
          {extraFields.map(property => (
            <h5 key={shortid.generate()}>
              {property}: {Array.isArray(edge[property]) ? edge[property].join(', ') : edge[property].toString()}
            </h5>
          ))}
        </Panel.Body>
      </Panel>
    );
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
    const getInfo = (pub) => {
      const paperInfo = {
        id: pub.uid,
        title: pub.title,
        authors: pub.authors,
        journal: pub.fulljournalname,
        source: pub.source,
        pubdate: pub.pubdate,
        url: `https://www.ncbi.nlm.nih.gov/pubmed/${pub.uid}/`,
        doid: pub.elocationid,
      };
      return { ...defaultInfo, ...paperInfo };
    };

    const getPubmedInformation = (pmid) => {
      let pmidStr = pmid.toString();
      if ((typeof pmidStr === 'string' || pmidStr instanceof String) && (pmidStr.indexOf(':') !== -1)) {
        // pmidStr has a colon, and therefore probably a curie, remove it.
        pmidStr = pmidStr.substr(pmidStr.indexOf(':') + 1);
      }

      return new Promise((resolve, reject) => {
        this.appConfig.getPubmedPublications(
          pmidStr,
          (pub) => {
            resolve(getInfo(pub));
          },
          (err) => {
            console.log(err);
            reject(defaultInfo);
          },
        );
      });
    };

    Promise.all(publications.map(pmid => new Promise(resolve => resolve(getPubmedInformation(pmid))))).then((data) => {
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
                subgraph={{ nodes: this.state.subgraph.nodes, edges: this.state.subgraph.edges }}
                layoutStyle="auto"
                layoutRandomSeed={1}
                showSupport
                omitEdgeLabel={false}
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
              {this.getEdgeInfoFrag(this.state.selectedEdgeId)}
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
