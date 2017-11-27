'use babel';

import React from 'react';
import { Row, Col, Tabs, Tab } from 'react-bootstrap';
import ProtocopQueryViewer from './ProtocopQueryViewer';
import ProtocopConstructionGraphViewer from './ProtocopConstructionGraphViewer';
import ProtocopGraphViewer from './ProtocopGraphViewer';

class ProtocopGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      graphTabKey: 1,
    };

    this.styles = {
      query: {
        paddingTop: 0,
        paddingBottom: 20,
        maxHeight: '200px',
        overflowY: 'auto',
      },
      graph: {
        paddingTop: 0,
        paddingBottom: 20,
        maxHeight: '500px',
        overflowY: 'auto',
      },
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
  }
  handleTabSelect(graphTabKey) {
    this.setState({ graphTabKey });
  }
  render() {
    let nNodes = 0;
    let nEdges = 0;
    let nEdgesSupport = 0;

    const isSummary = !(this.props.graph == null) && Object.prototype.hasOwnProperty.call(this.props.graph, 'node_count');
    let isEmpty = false;
    if (!isSummary) {
      const nodes = this.props.graph.nodes;
      if (!(nodes == null) || Array.isArray(nodes)) {
        nNodes = nodes.length;    
      }
      isEmpty = nNodes === 0;

      const edges = this.props.graph.edges;
      if (!(edges == null) || Array.isArray(edges)) {
        nEdges = edges.length;

        nEdgesSupport = edges.reduce((total, e) => total + !(e.type === 'Result' || e.type === 'Lookup'), 0);
      }
    } else {
      nNodes = this.props.graph.node_count;
      nEdges = this.props.graph.edge_count;
    }

    return (
      <div id="ProtocopGraph" className="col-md-12">
        <Row>
          <Col md={4}>
            <Row>
              <Col md={12}>
                <h5>{this.props.board.name}</h5>
                <p>{this.props.board.description}</p>
                {!isSummary && isEmpty &&
                  <p>
                    {'Sorry but we weren\'t able to build a blackboard for this query.'}
                  </p>
                }
                {!isSummary && !isEmpty &&
                  <ul>
                    <li>{`${nNodes} Nodes`}</li>
                    <li>{`${nEdges - nEdgesSupport} Primary Edges`}</li>
                    <li>{`${nEdgesSupport} Support Edges`}</li>
                  </ul>
                }
                {isSummary &&
                  <ul>
                    <li>{`${nNodes} Nodes`}</li>
                    <li>{`${nEdges} Edges`}</li>
                  </ul>
                }
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <h5>Query</h5>
                <ProtocopQueryViewer
                  query={this.props.query}
                />
              </Col>
            </Row>
          </Col>
          <Col md={8}>
            <div style={{ marginTop: '10px' }} />
            <Tabs activeKey={this.state.graphTabKey} onSelect={this.handleTabSelect} id="ProtocopGraphTabs" animation={false}>
              <Tab eventKey={1} title="Construction Graph">
                { this.state.graphTabKey === 1 &&
                <ProtocopConstructionGraphViewer
                  graph={this.props.constructionGraph}
                />
                }
              </Tab>
              <Tab eventKey={2} title="Blackboard">
                { this.state.graphTabKey === 2 &&
                <ProtocopGraphViewer
                  graph={this.props.graph}
                />
                }
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </div>
    );
  }
}

export default ProtocopGraph;
