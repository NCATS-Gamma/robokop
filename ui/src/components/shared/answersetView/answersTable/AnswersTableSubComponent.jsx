import React, { useEffect } from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import { FaThList, FaRegFileAlt } from 'react-icons/fa';
import { IoIosGitNetwork } from 'react-icons/io';
import axios from 'axios';
import shortid from 'shortid';

import config from '../../../../config.json';
import JsonView from './tableSubComponents/JsonView';
import MetaDataView from './tableSubComponents/MetaDataView';
import SubgraphView from './tableSubComponents/SubgraphView';

function makeNodePairs(nodes, edges) {
  const axiosArray = [];
  const nodePairs = [];
  const addrFun = (id1, id2) => `${config.protocol}://${config.host}:${config.port}/api/omnicorp/${id1}/${id2}`;
  for (let i = 0; i < nodes.length; i += 1) {
    if (!(('isSet' in nodes[i]) && nodes[i].isSet)) {
      for (let m = i + 1; m < nodes.length; m += 1) {
        if (!(('isSet' in nodes[m]) && nodes[m].isSet)) {
          // Both i and m are not from a set.

          // builds the api call address and pushes it into an array for the promises
          const addr = addrFun(nodes[i].id, nodes[m].id);
          axiosArray.push(axios.get(addr));
          // putting the node pairs as an array into an array for when we make the edges
          nodePairs.push([nodes[i].id, nodes[m].id]);
        }
      }
    }
  }
  // We picked pairs of nodes, due to the way simple view works, we might have literature_co-occurence edges for additional nodes
  // We need to look through those edges and add those node pairs
  edges.forEach((e) => {
    if (e.type === 'literature_co-occurrence') {
      const existingPair = nodePairs.find((p) => ((p[0] === e.source_id) && (p[1] === e.target_id)) || ((p[1] === e.source_id) && (p[0] === e.target_id)));
      if (!existingPair) {
        // We need to add this pair
        const addr = addrFun(e.source_id, e.target_id);
        axiosArray.push(axios.get(addr));
        nodePairs.push([e.source_id, e.target_id]);
      }
    }
  });

  const results = { calls: axiosArray, nodes: nodePairs };
  return results;
}

function addSupportEdges(graph, edgePubs, nodes) {
  const { edges } = graph;
  const updatedGraph = graph;
  edgePubs.forEach((pubs, index) => {
    // we only want to add the edge if it has any publications
    if (pubs.length) {
      // We found some pubs to put on the edge
      // There could already be an edge to which we want to add the edges
      const thisEdge = edges.find((e) => {
        const matchesForward = (e.source_id === nodes[index][0]) && (e.target_id === nodes[index][1]);
        const matchesBackward = (e.target_id === nodes[index][0]) && (e.source_id === nodes[index][1]);
        const isSupport = (e.type === 'literature_co-occurrence');

        return isSupport && (matchesForward || matchesBackward);
      });

      if (thisEdge) {
        // We fould an edge
        thisEdge.publications = pubs;
      } else {
        const newEdge = {
          publications: pubs,
          type: 'literature_co-occurrence',
          source_database: 'omnicorp',
          source_id: nodes[index][0],
          target_id: nodes[index][1],
          id: shortid.generate(),
        };
        edges.push(newEdge);
      }
    }
  });
  updatedGraph.edges = edges;
  return updatedGraph;
}

function fetchGraphSupport(axiosCalls) {
  // async call all of the axios calls for edge publications
  return Promise.all(axiosCalls);
}

export default function AnswersTableSubComponent(props) {
  const {
    concepts, messageStore, rowInfo, answersTableStore,
  } = props;

  function getGraph(answerId) {
    let newGraph = messageStore.activeAnswerGraph(answerId);
    answersTableStore.setGraph(newGraph);
    answersTableStore.setLoadedGraph(true);
    // returns the array of calls to make, and an array of node pairs
    // const { calls, nodes } = makeNodePairs(newGraph.nodes, newGraph.edges);
    // // async calls for omnicorp publications
    // fetchGraphSupport(calls)
    //   .then((result) => {
    //     const pubs = [];
    //     // put all the publications into one array
    //     result.forEach((graphTest) => pubs.push(graphTest.data));
    //     // adds support edges to graph object
    //     newGraph = addSupportEdges(newGraph, pubs, nodes);
    //     console.log('new new graph', newGraph);
    //     // this signifies that the graph is updated and to display the SubGraphViewer
    //     answersTableStore.setGraph(newGraph);
    //     answersTableStore.setLoadedGraph(true);
    //   })
    //   .catch((error) => {
    //     console.log('Error: ', error);
    //   });
  }

  useEffect(() => {
    const newRowData = messageStore.getDenseAnswer(rowInfo.original.id);
    answersTableStore.setRowData(newRowData);
  }, [rowInfo.original.id]);

  useEffect(() => {
    const {
      loadedGraph, activeButton, rowData, subComponentEnum,
    } = answersTableStore;
    if (!loadedGraph && activeButton === subComponentEnum.graph) {
      const answerId = rowData.id;
      getGraph(answerId);
    }
  }, [answersTableStore.activeButton, answersTableStore.rowData, answersTableStore.loadedGraph]);

  const { activeButton, subComponentEnum } = answersTableStore;
  const isJsonActive = activeButton === subComponentEnum.json;
  const isGraphActive = activeButton === subComponentEnum.graph;
  const isMetadataActive = activeButton === subComponentEnum.metadata;
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#fafafa',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: '#fff',
          border: '1px solid #ededed',
          boxShadow: '0px 0px 5px 0px #ececec',
          minHeight: '200px',
          width: '1000px',
        }}
      >
        <ButtonGroup
          vertical
          style={{
            position: 'absolute', top: '10px', left: '10px', zIndex: 1,
          }}
        >
          <Button
            active={isJsonActive}
            style={{ textAlign: 'left' }}
            onClick={() => answersTableStore.setActiveButton(answersTableStore.subComponentEnum.json)}
          >
            <span className="valign-center">
              <FaRegFileAlt />
              <span style={{ paddingLeft: '5px' }}>JSON</span>
            </span>
          </Button>
          <Button
            active={isGraphActive}
            style={{ textAlign: 'left' }}
            onClick={() => answersTableStore.setActiveButton(answersTableStore.subComponentEnum.graph)}
          >
            <div className="valign-center">
              <IoIosGitNetwork />
              <span style={{ paddingLeft: '5px' }}>Graph</span>
            </div>
          </Button>
          <Button
            active={isMetadataActive}
            style={{ textAlign: 'left' }}
            onClick={() => answersTableStore.setActiveButton(answersTableStore.subComponentEnum.metadata)}
          >
            <span className="valign-center">
              <FaThList />
              <span style={{ paddingLeft: '5px' }}>Metadata</span>
            </span>
          </Button>
        </ButtonGroup>
        {isJsonActive && (
          <JsonView
            rowData={answersTableStore.rowData}
          />
        )}
        {isGraphActive && (
          <SubgraphView
            messageStore={messageStore}
            answersTableStore={answersTableStore}
            concepts={concepts}
          />
        )}
        {isMetadataActive && (
          <MetaDataView
            concepts={concepts}
            answersTableStore={answersTableStore}
          />
        )}
      </div>
    </div>
  );
}
