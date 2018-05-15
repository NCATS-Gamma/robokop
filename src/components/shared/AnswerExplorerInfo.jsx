import React from 'react';

import { Row, Col, Panel } from 'react-bootstrap';
import SubGraphViewer from './SubGraphViewer';

const shortid = require('shortid');

class AnswerExplorerInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedEdge: null,
      selectedNode: null,
      edge: null,
      subgraph: {node_list: [], edge_list: []},
    };

    this.onGraphClick = this.onGraphClick.bind(this);
  }

  componentDidMount() {
    this.syncPropsAndState(this.props);
  }

  onGraphClick(event) {
    if (event.edges.length !== 0) { // Clicked on an Edge
      this.setState({ selectedEdge: event.edges[0], selectedNode: null });
    } else if (event.nodes.length !== 0) { // Clicked on an Edge
      this.setState({ selectedEdge: null, selectedNode: event.nodes[0] });
    } else { // Reset things since something else was clicked
      this.setState({ selectedEdge: null, selectedNode: null });
    }
  }
  getPublicationsFrag() {
    const somethingSelected = this.state.selectedEdge || this.state.selectedNode;
    let publicationListFrag = <div>Publication list... </div>;
    if (somethingSelected && this.state.selectedEdge) {
      // Edge is selected
      const edge = this.state.subgraph.edge_list.find(e => e.id === this.state.selectedEdge);
      publicationListFrag = <div>Publication list for {edge.id}</div>;
    } else if (somethingSelected && this.state.selectedNode) {
      // Node is selected
      const node = this.state.subgraph.node_list.find(n => n.id === this.state.selectedNode);
      publicationListFrag = <div>Publication list for {node.id}</div>;
    }
    return (
      <div>
        {somethingSelected &&
        <Panel style={{ marginTop: '15px' }}>
          <Panel.Heading>
            <Panel.Title componentClass="h3">
              Publications
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
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
        <Panel.Body>
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

    return urls;
  }
  getEdgeInfoFrag(edge) {
    if (!edge) {
      return (<div />);
    }
    let origin = 'Unknown';
    if ('origin_list' in edge) {
      if (Array.isArray(edge.origin_list) && edge.origin_list.length > 0) {
        origin = edge.origin_list.map(source => <span key={shortid.generate()}>{source} &nbsp; </span>);
      } else {
        origin = edge.origin_list;
      }
    }
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            {edge.type}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <h5>
            Established using {origin}
          </h5>
        </Panel.Body>
      </Panel>
    );
  }

  syncPropsAndState(newProps) {
    const { answer, selectedEdge } = newProps;
    const edge = answer.result_graph.edge_list.find(e => e.id === selectedEdge);
    const node_list = answer.result_graph.node_list.filter(n => ((n.id === edge.source_id) || (n.id === edge.target_id)));
    const node_list_ids = node_list.map(n => n.id);
    const edge_list = answer.result_graph.edge_list.filter(e => (node_list_ids.includes(e.source_id) && node_list_ids.includes(e.target_id)));

    const subgraph = { node_list, edge_list };

    this.setState({ subgraph, edge });
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
                layoutStyle="horizontal"
                layoutRandomSeed={0}
                callbackOnGraphClick={this.onGraphClick}
              />
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              {this.getNodeInfoFrag(this.state.subgraph.node_list[0])}
            </Col>
            <Col md={4}>
              {this.getEdgeInfoFrag(this.state.edge)}
            </Col>
            <Col md={4}>
              {this.getNodeInfoFrag(this.state.subgraph.node_list[1])}
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
