import React from 'react';
import { AutoSizer } from 'react-virtualized';
import { Grid, Row, Col, Form } from 'react-bootstrap';

import Loading from '../../components/Loading';
import CurieSelectorContainer from '../../components/shared/curies/CurieSelectorContainer';
import NeighborhoodViewer from './NeighborhoodViewer';
import NodeDetails from './NodeDetails';

class AlphaMainContents extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      term: this.props.identifier || '',
      curie: this.props.identifier || '',
      detailsLoading: false,
      detailsLoaded: false,
      nodeSources: [],
      nodeDetails: {},
      neighborhoodLoading: false,
      neighborhoodLoaded: false,
      neighborhood: {},
    };

    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.getDetails = this.getDetails.bind(this);
    this.getNeighborhood = this.getNeighborhood.bind(this);
  }

  componentDidMount() {
    const { identifier } = this.props;
    if (identifier) {
      this.handleCurieChange('', identifier, identifier);
    }
  }

  handleCurieChange(type, term, curie) {
    if (curie || !term) {
      this.setState({ curie, term });
    }
    if (curie) {
      this.getDetails(curie);
      this.getNeighborhood(curie);
    }
  }

  onSearch(input, type) {
    return this.props.appConfig.questionNewSearch(input, type);
  }

  getDetails(curie) {
    this.setState({ detailsLoading: true, detailsLoaded: false });
    this.props.appConfig.details(
      curie,
      (res) => {
        this.setState({
          detailsLoading: false, detailsLoaded: true, nodeDetails: res.node_information, nodeSources: res.other_sources,
        });
      },
      (err) => {
        console.log('Node Details error', err);
        this.setState({ detailsLoading: false, detailsLoaded: false });
      },
    );
  }

  getNeighborhood(curie) {
    this.setState({ neighborhoodLoading: true, neighborhoodLoaded: false });
    this.props.appConfig.neighborhood(
      curie,
      (res) => {
        this.setState({ neighborhoodLoading: false, neighborhoodLoaded: true, neighborhood: res });
      },
      (err) => {
        console.log('Neighborhood error', err);
        this.setState({ neighborhoodLoading: false, neighborhoodLoaded: false });
      },
    );
  }

  render() {
    const { concepts } = this.props;
    const {
      term, curie, nodeSources, nodeDetails, detailsLoading, neighborhoodLoading,
      neighborhood, detailsLoaded, neighborhoodLoaded,
    } = this.state;
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
                    style={{
                        padding: '5px 0px',
                    }}
                  >
                    <CurieSelectorContainer
                      concepts={concepts}
                      search={this.onSearch}
                      width={width}
                      initialInputs={{ type: '', term, curie }}
                      onChangeHook={(ty, te, cu) => this.handleCurieChange(ty, te, cu)}
                      disableType
                      disableTypeFilter
                    />
                  </div>
                )}
              </AutoSizer>
            </Col>
          </Row>
        </Form>
        {detailsLoaded && (
          <NodeDetails
            details={nodeDetails}
            sources={nodeSources}
            sourceNode={term}
          />
        )}
        {neighborhoodLoaded && (
          <NeighborhoodViewer
            data={neighborhood}
            concepts={concepts}
            sourceNode={term}
          />
        )}
        {(neighborhoodLoading || detailsLoading) &&
          <Loading />
        }
      </Grid>
    );
  }
}

export default AlphaMainContents;
