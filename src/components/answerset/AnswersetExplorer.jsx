import React from 'react';
import { ButtonGroup, Button, Glyphicon, Tabs, Tab } from 'react-bootstrap';
import AnswersetInteractive from './AnswersetInteractive';
import AnswersetList from './AnswersetList'

class AnswersetExplorer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: 1,
    };

    this.styles = {
      buttonRow: {
        padding: 5,
      },
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
  }

  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }

  render() {
    // const graph = this.props.graph;

    // const isGraph = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'nodes'));
    
    // let nNodes = 0;
    // let nEdges = 0;
    // if (isGraph) {
    //   isEmpty = graph.nodes.length === 0;
    //   nNodes = graph.nodes.length;
    //   nEdges = graph.edges.length;
    // } else { // isSummary
    //   isEmpty = graph.node_count === 0;
    //   nNodes = graph.node_count;
    //   nEdges = graph.edge_count;
    // }

    return (
      <div id="AnswersetExplorer" className="col-md-12">
        <div>
          <div id="AnswersetExplorer_Buttons" className="col-md-12" style={this.styles.buttonRow}>
            <h5>{'Potential answers have been ranked and are shown below.'}
            </h5>
          </div>
          <Tabs activeKey={this.state.tabKey} onSelect={this.handleTabSelect} id="AnswersetExplorerTabs">
            <Tab eventKey={1} title="List Explorer">
              <AnswersetList
                answers={this.props.answers}
              />
            </Tab>
            <Tab eventKey={2} title="Interactive">
              <AnswersetInteractive
                answers={this.props.answers}
              />
            </Tab>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default AnswersetExplorer;
