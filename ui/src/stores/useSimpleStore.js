import { useState } from 'react';
import entityNameDisplay from '../utils/entityNameDisplay';

export default function useSimpleStore(initialValues) {
  const [type1, setType1] = useState(initialValues.type1 || '');
  const [type2, setType2] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [term, setTerm] = useState('');
  const [similarType, setSimilarType] = useState('');
  const [curies, updateCuries] = useState(['']);
  const [terms, updateTerms] = useState(['']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [fail, setFail] = useState(false);
  const [includeDescendants, toggleDescendants] = useState(false);
  const [maxResults, setMaxResults] = useState(initialValues.maxResults || 100);
  const [threshold, setThreshold] = useState(0.5);

  function onSearch(input, type) {
    // TODO: reimplement this
    return;
    // return this.appConfig.questionNewSearch(input, type);
  }

  function handleCurieChange(i, ty, te, cu) {
    if (cu || !te) {
      curies[i] = cu;
      terms[i] = te;
      updateCuries([...curies]);
      updateTerms([...terms]);
    }
  }

  function addCuries() {
    curies.push('');
    terms.push('');
    updateCuries([...curies]);
    updateTerms([...terms]);
  }

  function deleteCuries(i) {
    curies.splice(i, 1);
    terms.splice(i, 1);
    updateCuries([...curies]);
    updateTerms([...terms]);
  }

  function getTableColumns(res) {
    if (res.length === 0) {
      return [{ Header: 'No data found', width: '100%', className: 'center' }];
    }
    const colHeaders = Object.keys(res[0]).map((col) => {
      const colSpecObj = {};
      colSpecObj.Header = entityNameDisplay(col);
      colSpecObj.accessor = col;
      colSpecObj.width = '33%';
      colSpecObj.className = 'center';
      return colSpecObj;
    });
    return colHeaders;
  }

  return {
    type1,
    setType1,
    type2,
    setType2,
    identifier,
    setIdentifier,
    term,
    setTerm,
    similarType,
    setSimilarType,
    curies,
    updateCuries,
    terms,
    updateTerms,
    results,
    setResults,
    loading,
    setLoading,
    ready,
    setReady,
    fail,
    setFail,
    includeDescendants,
    toggleDescendants,
    maxResults,
    setMaxResults,
    threshold,
    setThreshold,
    onSearch,
    addCuries,
    deleteCuries,
    handleCurieChange,
    getTableColumns,
  };
}
