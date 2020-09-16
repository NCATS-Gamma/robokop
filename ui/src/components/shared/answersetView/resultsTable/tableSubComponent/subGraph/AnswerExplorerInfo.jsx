import React, { useState, useEffect } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { FaDownload } from 'react-icons/fa';
import shortid from 'shortid';

import SubGraphViewer from '../../../../graphs/SubGraphViewer';
import PubmedList from './PubmedList';

import curieUrls from '../../../../../../utils/curieUrls';
import ctdUrls from '../../../../../../utils/ctdUrls';
import getNodeTypeColorMap from '../../../../../../utils/colorUtils';
import entityNameDisplay from '../../../../../../utils/entityNameDisplay';

import config from '../../../../../../config.json';

const nodeBlocklist = [
  'isSet', 'labels', 'label', 'equivalent_identifiers', 'type',
  'id', 'degree', 'name', 'title', 'color', 'binding', 'level',
];
const edgeBlocklist = [
  'binding', 'ctime', 'id', 'publications', 'source_database',
  'source_id', 'target_id', 'type',
];

export default function AnswerExplorerInfo(props) {
  const { graph, selectedEdge: parentSelectedEdge } = props;
  const [selectedEdge, setSelectedEdge] = useState(parentSelectedEdge);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [subgraph, setSubgraph] = useState({ nodes: [], edges: [] });
  const [disableGraphClick, setDisableGraphClick] = useState(false);
  const [downloadingPubs, setDownloadingPubs] = useState(false);

  function syncPropsAndState() {
    const nodes = graph.nodes.filter((n) => ((n.id === selectedEdge.source_id) || (n.id === selectedEdge.target_id)));
    const nodeIds = nodes.map((n) => n.id);
    const edges = graph.edges.filter((e) => (nodeIds.includes(e.source_id) && nodeIds.includes(e.target_id)));

    setSubgraph({ nodes, edges });
    setSelectedEdgeId(selectedEdge.edgeIdFromKG);
    setSelectedNodeId(null);

    if (edges.length === 1) {
      setDisableGraphClick(true);
    }
  }

  useEffect(() => {
    syncPropsAndState();
  }, []);

  function onGraphClick(event) {
    if (disableGraphClick) {
      return;
    }

    if (event.edges.length !== 0) { // Clicked on an Edge
      setSelectedEdgeId(event.edgeObjects[0].edgeIdFromKG);
      setSelectedEdge(event.edgeObects[0]);
    } else if (event.nodes.length !== 0) { // Clicked on a node
      setSelectedNodeId(event.nodes[0]);
    }
  }

  function getNodeInfoFrag(n) {
    if (!n) {
      return <div />;
    }
    const title = n.name || n.id;
    const edge = subgraph.edges.find((e) => e.id === selectedEdgeId);
    const urls = curieUrls(n.id);
    if (edge.source_database && edge.source_database.includes('ctd')) {
      const urlObj = ctdUrls(n.type, n.equivalent_identifiers);
      urls.push(urlObj);
    }
    const nodeTypeColorMap = getNodeTypeColorMap(config.concepts);
    const backgroundColor = nodeTypeColorMap(n.type);
    const extraFields = Object.keys(n).filter((property) => !nodeBlocklist.includes(property));
    return (
      <Card>
        <h3 className="cardTitle" style={{ backgroundColor }}>
          {title}
          <div className="pull-right">
            {
              urls.map((link) => (
                <span key={shortid.generate()} style={{ margin: '0px 5px' }}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <img src={link.iconUrl} alt={link.label} height={16} width={16} />
                  </a>
                </span>
              ))
            }
          </div>
        </h3>
        <CardContent className="cardContent">
          <h5>
            {`type: ${entityNameDisplay(n.type)}`}
          </h5>
          <h5>
            {`id: ${n.id}`}
          </h5>
          {extraFields.map((property) => (
            <h5 key={shortid.generate()}>
              {`${property}: ${n[property].toString()}`}
            </h5>
          ))}
        </CardContent>
      </Card>
    );
  }

  function getEdgeInfoFrag(edgeId) {
    if (!edgeId) {
      return (<div />);
    }
    const edge = subgraph.edges.find((e) => e.id === edgeId);

    const extraFields = Object.keys(edge).filter((property) => !edgeBlocklist.includes(property));

    let origin = null;
    const sourceToOriginString = (source) => source; // source.substr(0, source.indexOf('.'));

    if ('source_database' in edge) {
      if (Array.isArray(edge.source_database) && edge.source_database.length > 0) {
        origin = edge.source_database.map((source) => sourceToOriginString(source));
      } else {
        origin = [sourceToOriginString(edge.source_database)];
      }
    }
    return (
      <Card>
        <h3 className="cardTitle greyBackground">
          {edge.type}
        </h3>
        <CardContent className="cardContent">
          {origin && (
            <h5>
              Established using:
              <p>
                {origin.join(', ')}
              </p>
            </h5>
          )}
          {extraFields.map((property) => (
            <h5 key={shortid.generate()}>
              {`${property}: ${Array.isArray(edge[property]) ? edge[property].join(', ') : edge[property].toString()}`}
            </h5>
          ))}
        </CardContent>
      </Card>
    );
  }

  function getPublicationsFrag() {
    let publicationListFrag = <div><p>Click on edge above to see a list of publications.</p></div>;
    let publicationsTitle = 'Publications';

    let publications = [];
    if (selectedEdgeId !== null) {
      // Edge is selected
      let edge = subgraph.edges.find((e) => e.id === selectedEdgeId);
      if (typeof edge === 'undefined') {
        edge = subgraph.edges.find((e) => e.edgeIdFromKG === selectedEdgeId);
      }
      if (typeof edge === 'undefined') {
        console.log('Couldn\'t find this edge', selectedEdgeId, subgraph.edges);
        return (
          <div>
            <h4 style={{ marginTop: '15px' }}>
              An error was encountered fetching publication information.
            </h4>
          </div>
        );
      }

      const sourceNode = subgraph.nodes.find((n) => n.id === edge.source_id);
      const targetNode = subgraph.nodes.find((n) => n.id === edge.target_id);
      if ('publications' in edge && Array.isArray(edge.publications)) {
        ({ publications } = edge);
      }
      publicationsTitle = `${publications.length} Publications for ${sourceNode.name || sourceNode.id}
        and ${targetNode.name || targetNode.id}`;
      publicationListFrag = <PubmedList publications={publications} />;
    } else if (selectedNodeId) {
      // Node is selected
      const node = subgraph.nodes.find((n) => n.id === selectedNodeId);
      if ('publications' in node && Array.isArray(node.publications)) {
        ({ publications } = node);
      }
      publicationsTitle = `${publications.length} Publications for ${node.name}`;
      publicationListFrag = <PubmedList publications={publications} />;
    }

    return (
      <Card className="publicationsContainer">
        <h3 className="cardTitle greyBackground">
          {publicationsTitle}
        </h3>
        <CardContent style={{ padding: 0 }}>
          {publicationListFrag}
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="answerExplorerContainer">
      <SubGraphViewer
        height={200}
        subgraph={{ nodes: subgraph.nodes, edges: subgraph.edges }}
        layoutStyle="auto"
        layoutRandomSeed={1}
        showSupport
        // TODO: add this field to the subgraphviewer
        // interactable={false}
        omitEdgeLabel={false}
        varyEdgeSmoothRoundness
        callbackOnGraphClick={onGraphClick}
        concepts={config.concepts}
      />
      <div id="subgraphModalNodeEdgeInfo">
        {getNodeInfoFrag(subgraph.nodes[0])}
        {getEdgeInfoFrag(selectedEdgeId)}
        {getNodeInfoFrag(subgraph.nodes[1])}
      </div>
      {getPublicationsFrag()}
    </div>
  );
}
