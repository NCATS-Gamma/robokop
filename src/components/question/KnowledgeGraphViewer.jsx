import React from 'react';

class KnowledgeGraphViewer extends React.Component {
  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div style={{ height: this.props.height, width: this.props.width }}>
        <h3>Graph Visualiztion here</h3>
        <h5>{`${this.props.graph.nodes.length} Concepts`}</h5>
        <h5>{`${this.props.graph.edges.length} Edges`}</h5>
      </div>
    );
  }
}

KnowledgeGraphViewer.defaultProps = {
  height: '500px',
  width: '500px',
};


export default KnowledgeGraphViewer;
