import { useState } from 'react';

const subComponentEnum = {
  graph: 1,
  json: 2,
  metadata: 3,
};

export default function useAnswersetTable() {
  const [nodeId, setNodeId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [activeButton, setActiveButton] = useState();
  const [rowData, setRowData] = useState({});
  const [graph, setGraph] = useState({});
  const [loadedGraph, setLoadedGraph] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState({});

  return {
    answers,
    setAnswers,
    columns,
    setColumns,
    nodeId,
    setNodeId,
    activeButton,
    setActiveButton,
    rowData,
    setRowData,
    graph,
    setGraph,
    loadedGraph,
    setLoadedGraph,
    selectedEdge,
    setSelectedEdge,
    subComponentEnum,
  };
}
