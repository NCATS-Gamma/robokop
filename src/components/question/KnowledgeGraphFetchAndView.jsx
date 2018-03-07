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

    this.styles = {
      container: {
        border: '1px solid black',
        margin: 'auto',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    };

    this.fetch = this.fetch.bind(this);
  }

  fetch() {
    this.setState({ fetching: true });
    this.props.callbackFetchGraph(() => this.setState({ fetching: false }));
  }

  render() {
    const showGraph = !(this.props.subgraph === null);
    const showFetching = this.state.fetching;
    const showFetchButton = !showGraph && !showFetching;
    
    const propsStyle = { height: this.props.height, width: this.props.width };
    const containerStyle = this.styles.container;
    if (!showGraph) {
      containerStyle.backgroundColor = '#eee';
    } else {
      containerStyle.backgroundColor = '#fff';
    }

    return (
      <div style={{ ...containerStyle, ...propsStyle }}>
        {showGraph &&
          <KnowledgeGraphViewer
            height={this.props.height}
            width={this.props.width}
            graph={this.props.subgraph}
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
