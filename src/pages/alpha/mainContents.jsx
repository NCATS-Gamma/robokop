import React from 'react';
import { AutoSizer } from 'react-virtualized';
import { Grid, Row, Col, Form, Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import shortid from 'shortid';

import Loading from '../../components/Loading';
import CurieSelectorContainer from '../../components/shared/curies/CurieSelectorContainer';
import NeightborhoodViewer from './NeighborhoodViewer';

class AlphaMainContents extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: '',
      term: '',
      curie: '',
      sourcesLoading: false,
      sourcesLoaded: false,
      sources: [],
      neighborhoodLoading: false,
      neighborhoodLoaded: false,
      neighborhood: {},
    };

    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.explore = this.explore.bind(this);
    this.getSources = this.getSources.bind(this);
    this.getNeighborhood = this.getNeighborhood.bind(this);
  }

  handleCurieChange(type, term, curie) {
    if (curie || !term) {
      this.setState({ curie, type, term });
    }
  }

  onSearch(input, type) {
    return this.props.appConfig.questionNewSearch(input, type);
  }

  getSources(curie) {
    this.setState({ sourcesLoading: true, sourcesLoaded: false });
    this.props.appConfig.explore(
      curie,
      (res) => {
        console.log('sources response', res);
        this.setState({ sourcesLoading: false, sourcesLoaded: true, sources: res });
      },
      (err) => {
        console.log('sources error', err);
        this.setState({ sourcesLoading: false, sourcesLoaded: false });
      },
    );
    // const curieMap = new Map();
    // results.forEach(res => curieMap.add(res.identifier));
  }

  getNeighborhood(curie) {
    this.setState({ neighborhoodLoading: true, neighborhoodLoaded: false });
    this.props.appConfig.neighborhood(
      curie,
      (res) => {
        console.log('neighborhood response', res);
        this.setState({ neighborhoodLoading: false, neighborhoodLoaded: true, neighborhood: res });
      },
      (err) => {
        console.log('Neighborhood error', err);
        this.setState({ neighborhoodLoading: false, neighborhoodLoaded: false });
      },
    );
  }

  explore() {
    const { curie } = this.state;
    this.getSources(curie);
    this.getNeighborhood(curie);
  }

  render() {
    const { concepts } = this.props;
    const {
      type, term, curie, sources, sourcesLoading, neighborhoodLoading, neighborhood,
      sourcesLoaded, neighborhoodLoaded,
    } = this.state;
    return (
      <Grid>
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
                      initialInputs={{ type, term, curie }}
                      onChangeHook={(ty, te, cu) => this.handleCurieChange(ty, te, cu)}
                      disableType
                      disableTypeFilter
                    />
                  </div>
                    )}
              </AutoSizer>
            </Col>
          </Row>
          <Row style={{ textAlign: 'center', margin: '20px' }}>
            <Button
              onClick={this.explore}
              disabled={!curie}
            >
              Explore the neighborhood
            </Button>
          </Row>
        </Form>
        {sourcesLoading &&
          <Loading
            message="Loading sources..."
          />
        }
        {sourcesLoaded && (
          <ListGroup>
            {sources.map(source => (
              <ListGroupItem
                key={shortid.generate()}
                href={source.url}
                target="_blank"
                style={{ display: 'inline-block', width: '150px' }}
              >
                {source.label}
                <span style={{ margin: '0px 5px' }}>
                  <img src={source.iconUrl} alt={source.label} height={16} width={16} />
                </span>
              </ListGroupItem>
            ))}
          </ListGroup>
        )}
        {neighborhoodLoading &&
          <Loading
            message="Loading neighborhood graph..."
          />
        }
        {neighborhoodLoaded && (
          <NeightborhoodViewer
            data={neighborhood}
            concepts={concepts}
          />
        )}
      </Grid>
    );
  }
}

export default AlphaMainContents;
