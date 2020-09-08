import { useState, useRef } from 'react';

const _publicFields = ['id', 'source_id', 'target_id', 'predicate'];

export default function useEdgePanels() {
  const [id, setId] = useState(null);
  const [sourceId, setSourceId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [predicate, setPredicate] = useState([]);
  const [targetNodeList, setTargetNodeList] = useState([]);
  const [connectionsCountReady, setConnectionsCountReady] = useState(false);

  const [broken, setBroken] = useState(false);

  const [predicatesReady, setPredicatesReady] = useState(false); // True when requesting end-point for predicates for source/target pairing
  const [predicateList, updatePredicateList] = useState([]);
  const [disablePredicates, setDisablePredicates] = useState(false);

  const connectionsCancel = useRef(null);
  const predicatesCancel = useRef(null);

  function reset() {
    setId(null);
    setSourceId(null);
    setTargetId(null);
    setPredicate([]);
    setTargetNodeList([]);
    setConnectionsCountReady(false);
    setBroken(false);
    setPredicatesReady(false);
    updatePredicateList([]);
    setDisablePredicates(false);
  }

  function initialize(seed) {
    console.log(seed);
    reset();
    setId(seed.id || '');
    setSourceId(seed.source_id || null);
  }

  return {
    id,
    sourceId,
    targetId,
    reset,
    initialize,
  };
}
