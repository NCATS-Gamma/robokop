import React from 'react';
import { Button, ProgressBar } from 'react-bootstrap';

import KnowledgeGraphViewer from './KnowledgeGraphViewer';

class KnowledgeGraphFetchAndView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fetching: false,
      graph: null,
    };

    this.fetch = this.fetch.bind(this);
  }

  fetch() {
    this.setState(
      { fetching: true },
      this.setState({ graph: this.props.callbackFetchGraph(), fetching: false }),
    );
  }

  render() {
    const showGraph = !(this.state.graph === null);
    const showFetching = this.state.fetching;
    const showFetchButton = !showGraph && !showFetching;
    
    return (
      <div style={{ height: this.props.height, width: this.props.width }}>
        {showGraph &&
          <KnowledgeGraphViewer
            graph={this.state.graph}
          />
        }
        {showFetching &&
          <div>
            <h5>Downloading Knowledge Sub Graph</h5>
            <ProgressBar active now={100} />
          </div>
        }
        {showFetchButton &&
          <Button onClick={this.fetch}>
            Get Knowledge Sub Graph
          </Button>
        }
      </div>
    );
  }
}

KnowledgeGraphFetchAndView.defaultProps = {
  height: '500px',
  width: '500px',
  callbackFetchGraph: () => {},
};


export default KnowledgeGraphFetchAndView;
