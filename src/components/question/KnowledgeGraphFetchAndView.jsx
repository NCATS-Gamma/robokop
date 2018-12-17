import React from 'react';
import { Button, ProgressBar, Panel } from 'react-bootstrap';
import { BubbleLoader } from 'react-css-loaders';

import KnowledgeGraphViewer from './KnowledgeGraphViewer';

class KnowledgeGraphFetchAndView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fetching: false,
    };

    this.getHeight = this.getHeight.bind(this);
    this.getWidth = this.getWidth.bind(this);
    this.scrollGraphToTop = this.scrollGraphToTop.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  getHeight() {
    const h = $(window).height() - 50;
    return `${h}px`;
  }
  getWidth() {
    let w = 500;
    w = $('#kgFetchDiv').innerWidth();
    // Ask how big the parent div is?
    return `${w}px`;
  }
  scrollGraphToTop() {
    if (this.props.scrollToId !== '') {
      $('html, body').animate(
        {
          scrollTop: $(this.props.scrollToId).offset().top - 3,
        },
        1000,
      );
    }
  }

  fetch() {
    this.setState({ fetching: true });
    this.props.callbackFetchGraph(() => this.setState({ fetching: false }, this.scrollGraphToTop()), () => this.setState({ fetching: false }));
  }

  render() {
    const { fetching } = this.state;

    const showGraph = !(this.props.subgraph === null);
    const showFetching = fetching;
    const showFetchButton = !showGraph && !showFetching;
    const showWait = this.props.wait;

    const panelExtraStyle = { margin: 0, border: 'none' };

    const height = this.getHeight();
    const width = this.getWidth();

    return (
      <div id="kgFetchDiv" style={{ display: 'table-cell', width: '100%', verticalAlign: 'middle', textAlign: 'center' }}>
        {(showFetchButton || showFetching || showWait) &&
          <div>
            {showWait &&
              <p>
                Knowledge graph update in progress.
              </p>
            }
            {/* {!showWait &&
              <p>
                To explore the knowledge graph we will need to load it...
              </p>
            } */}
            {!showFetching && !showWait &&
              <Button
                onClick={this.fetch}
                disabled={showFetching || showWait}
              >
                Load Graph
              </Button>
            }
            {showFetching &&
              <BubbleLoader style={{ marginTop: '0px' }} color="#b8c6db" />
            }
          </div>
        }
        {showGraph &&
          <KnowledgeGraphViewer
            height={height}
            width={width}
            graph={this.props.subgraph}
            callbackRefresh={this.props.callbackRefresh}
            concepts={this.props.concepts}
          />
        }
      </div>
    );
  }
}

KnowledgeGraphFetchAndView.defaultProps = {
  subgraph: null,
  wait: false,
  callbackFetchGraph: () => {},
  callbackRefresh: () => {},
  scrollToId: '',
};


export default KnowledgeGraphFetchAndView;
