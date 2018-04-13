import React from 'react';
import { Button, ProgressBar, Panel } from 'react-bootstrap';

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
    $('html, body').animate(
      {
        scrollTop: $(this.props.scrollToId).offset().top - 3,
      },
      1000,
    );
  }

  fetch() {
    this.setState({ fetching: true });
    this.props.callbackFetchGraph(() => this.setState({ fetching: false }, this.scrollGraphToTop()));
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
      <div id="kgFetchDiv">
        {(showFetchButton || showFetching || showWait) &&
          <div style={{ margin: '15px' }}>
            {showWait &&
              <p>
                Knowledge graph update in progress.
              </p>
            }
            {/* {!showWait &&
              <p>
                To explore knowledge graph we will need to load it...
              </p>
            } */}
            <Button
              onClick={this.fetch}
              disabled={showFetching || showWait}
            >
              {!showFetching && !showWait &&
                'Explore'
              }
              {showFetching && !showWait &&
                'Loading ...'
              }
              {showWait &&
                'Please wait...'
              }
            </Button>
          </div>
        }
        <Panel style={panelExtraStyle} id="collapsible-panel-kg" expanded={showGraph} onToggle={() => {}}>
          <Panel.Collapse>
            <Panel.Body style={{ padding: '0px' }}>
              {showGraph &&
              <KnowledgeGraphViewer
                height={height}
                width={width}
                graph={this.props.subgraph}
                callbackRefresh={this.props.callbackRefresh}
              />
              }
            </Panel.Body>
          </Panel.Collapse>
        </Panel>
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
