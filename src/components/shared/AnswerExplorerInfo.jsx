import React from 'react';

import { Row, Col, Panel } from 'react-bootstrap';
import SubGraphViewer from './SubGraphViewer';
import PubmedList from './PubmedList';

const shortid = require('shortid');

class AnswerExplorerInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedEdgeId: null,
      selectedNodeId: null,
      edge: null,
      subgraph: { nodes: [], edges: [] },
      disbleGraphClick: false,
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

    if (event.edges.length !== 0) { // Clicked on an Edge
      this.setState({ selectedEdgeId: event.edges[0], selectedNodeId: null });
    } else if (event.nodes.length !== 0) { // Clicked on an Edge
      this.setState({ selectedEdgeId: null, selectedNodeId: event.nodes[0] });
    } else { // Reset things since something else was clicked
      this.setState({ selectedEdgeId: null, selectedNodeId: null });
    }
  }
  getPublicationsFrag() {
    const somethingSelected = this.state.selectedEdgeId || this.state.selectedNodeId;
    let publicationListFrag = <div>Publication list... </div>;
    let publicationsTitle = 'Publications';

    if (somethingSelected && this.state.selectedEdgeId) {
      // Edge is selected
      const edge = this.state.subgraph.edges.find(e => e.id === this.state.selectedEdgeId);
      const sourceNode = this.state.subgraph.nodes.find(n => n.id === edge.source_id);
      const targetNode = this.state.subgraph.nodes.find(n => n.id === edge.target_id);
      let publications = [];
      if ('publications' in edge && Array.isArray(edge.publications)) {
        publications = edge.publications;
      }
      publicationsTitle = `${publications.length} Publications for ${sourceNode.description} and ${targetNode.description}`;
      publicationListFrag = <PubmedList publications={publications} />;
    } else if (somethingSelected && this.state.selectedNode) {
      // Node is selected
      const node = this.state.subgraph.nodes.find(n => n.id === this.state.selectedNodeId);
      let publications = [];
      if ('publications' in node && Array.isArray(node.publications)) {
        publications = node.publications;
      }
      publicationsTitle = `${publications.length} Publications for ${node.description}`;
      publicationListFrag = <PubmedList publications={publications} />;
    }

    return (
      <div>
        {somethingSelected &&
        <Panel style={{ marginTop: '15px' }}>
          <Panel.Heading>
            <Panel.Title componentClass="h3">
              {publicationsTitle}
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body style={{ padding: 0 }}>
            {publicationListFrag}
          </Panel.Body>
        </Panel>
        }
        {!somethingSelected &&
        <h4 style={{ marginTop: '15px' }}>
          Select a node or edge in the graph above to browse relevant publications.
        </h4>
        }
      </div>
    );
  }
  getNodeInfoFrag(n) {
    if (!n || !('name' in n)) {
      return (<div />);
    }

    const urls = this.getNodeUrl(n.name);
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            {n.description}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ minHeight: '100px' }}>
          <h5>
            {n.type} - {n.name}
          </h5>
          {
            urls.map(link => <span key={shortid.generate()}><a href={link.url} target="_blank">{link.label}</a> &nbsp; </span>)
          }
        </Panel.Body>
      </Panel>
    );
  }

  getNodeUrl(id) {
    const onto = id.substr(0, id.indexOf(':'));
    const entry = id.substr(id.indexOf(':') + 1);
    const urls = [];
    if (onto.toLowerCase() === 'db') {
      // drug bank - https://www.drugbank.ca/drugs/DB00619
      urls.push({ label: 'Drug Bank', url: `https://www.drugbank.ca/drugs/${id.replace(':','')}` });
    } else if (onto.toLowerCase() === 'hgnc') {
      // HGNC - https://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=HGNC:8856
      urls.push({ label: 'HGNC', url: `https://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=${id}` });
    } else {
      // http://purl.obolibrary.org/obo/MONDO_0022308
      const ontobeeUrl = `http://purl.obolibrary.org/obo/${id.replace(':','_')}`;
      urls.push({ label: 'Ontobee', url: ontobeeUrl });

      // https://www.ebi.ac.uk/ols/ontologies/mondo/terms?iri=http%3A%2F%2Fpurl.obolibrary.org%2Fobo%2FMONDO_0022308
      urls.push({ label: 'EMBL-EBI', url: `https://www.ebi.ac.uk/ols/ontologies/${onto.toLowerCase()}/terms?iri=${encodeURIComponent(ontobeeUrl)}` });
    }
    urls.push({ label: 'N2T', url: `http://n2t.net/${id}` });

    return urls;
  }
  getEdgeInfoFrag(edge) {
    if (!edge) {
      return (<div />);
    }
    let origin = 'Unknown';
    if ('provided_by' in edge) {
      if (Array.isArray(edge.provided_by) && edge.provided_by.length > 0) {
        origin = edge.provided_by.map(source => <span key={shortid.generate()}>{source} &nbsp; </span>);
      } else {
        origin = edge.provided_by;
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
            Established using {origin}
          </h5>
        </Panel.Body>
      </Panel>
    );
  }

  syncPropsAndState(newProps) {
    const { graph, selectedEdge } = newProps;

    const nodes = graph.nodes.filter(n => ((n.id === selectedEdge.source_id) || (n.id === selectedEdge.target_id)));
    const nodeIds = nodes.map(n => n.id);
    const edges = graph.edges.filter(e => (nodeIds.includes(e.source_id) && nodeIds.includes(e.target_id)));

    const subgraph = { nodes, edges };
    this.setState({ subgraph, edge: selectedEdge });

    if (edges.length === 1) {
      this.setState({ selectedEdgeId: selectedEdge.id, selectedNodeId: null, disbleGraphClick: true });
    }
  }

  render() {
    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={12}>
              <SubGraphViewer
                height={200}
                subgraph={this.state.subgraph}
                layoutStyle="auto"
                layoutRandomSeed={1}
                showSupport
                callbackOnGraphClick={this.onGraphClick}
              />
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              {this.getNodeInfoFrag(this.state.subgraph.nodes[0])}
            </Col>
            <Col md={4}>
              {this.getEdgeInfoFrag(this.state.edge)}
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
