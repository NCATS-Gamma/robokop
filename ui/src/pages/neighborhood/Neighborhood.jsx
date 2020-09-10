import React, { useState, useEffect } from 'react';
import { AutoSizer } from 'react-virtualized';
import {
  Grid, Row, Col, Form,
} from 'react-bootstrap';

import Loading from '../../components/loading/Loading';
import CurieSelectorContainer from '../../components/shared/curies/CurieSelectorContainer';
import NeighborhoodViewer from './NeighborhoodViewer';
import NodeDetails from './NodeDetails';

import './neighborhood.css';
import config from '../../config.json';

export default function Neighborhood(props) {
  const { identifier } = props;
  const [term, updateTerm] = useState('');
  const [curie, updateCurie] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsReady, setDetailsReady] = useState(false);
  const [nodeSources, setNodeSources] = useState([]);
  const [nodeDetails, setNodeDetails] = useState({});
  const [neighborhood, setNeighborhood] = useState({});
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);
  const [neighborhoodReady, setNeighborhoodReady] = useState(false);

  function onSearch(input, type) {
    return this.props.appConfig.questionNewSearch(input, type);
  }

  function getDetails(curie) {
    setDetailsLoading(true);
    setDetailsReady(false);
    this.props.appConfig.details(
      curie,
      (res) => {
        setDetailsLoading(false);
        setDetailsReady(true);
        setNodeDetails(res.node_information);
        setNodeSources(res.other_sources);
      },
      (err) => {
        console.log('Node Details error', err);
        setDetailsLoading(false);
        setDetailsReady(false);
      },
    );
  }

  function getNeighborhood(curie) {
    setNeighborhoodLoading(true);
    setNeighborhoodReady(false);
    this.props.appConfig.neighborhood(
      curie,
      (res) => {
        setNeighborhoodLoading(false);
        setNeighborhoodReady(true);
        setNeighborhood(res);
      },
      (err) => {
        console.log('Neighborhood error', err);
        setNeighborhoodLoading(false);
        setNeighborhoodReady(false);
      },
    );
  }

  function handleCurieChange(type, term, curie) {
    if (curie || !term) {
      updateCurie(curie);
      updateTerm(term);
    }
    if (curie) {
      getDetails(curie);
      getNeighborhood(curie);
    }
  }

  useEffect(() => {
    if (identifier) {
      handleCurieChange('', identifier, identifier);
    }
  }, []);

  return (
    <Grid>
      <h1 className="robokopApp">
        Neighborhood Explorer
        <br />
        <small>
          Perform a simple one-hop query on a specified node to see node details, knowledge graph, and table of neighboring nodes.
          Click on rows in the table to perform a similar query on that node.
        </small>
      </h1>
      <Form>
        <Row>
          <Col sm={12}>
            <AutoSizer disableHeight>
              {({ width }) => (
                <div
                  style={{ padding: '5px 0px' }}
                >
                  <CurieSelectorContainer
                    concepts={config.concepts}
                    search={onSearch}
                    width={width}
                    initialInputs={{ type: '', term, curie }}
                    onChangeHook={(ty, te, cu) => handleCurieChange(ty, te, cu)}
                    disableType
                    disableTypeFilter
                  />
                </div>
              )}
            </AutoSizer>
          </Col>
        </Row>
      </Form>
      {detailsReady && (
        <NodeDetails
          details={nodeDetails}
          sources={nodeSources}
          sourceNode={term}
        />
      )}
      {neighborhoodReady && (
        <NeighborhoodViewer
          data={neighborhood}
          concepts={config.concepts}
          sourceNode={term}
        />
      )}
      {(neighborhoodLoading || detailsLoading) && (
        <Loading />
      )}
    </Grid>
  );
}
