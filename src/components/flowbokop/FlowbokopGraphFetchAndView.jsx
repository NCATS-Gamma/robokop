import React from 'react';
import PropTypes from 'prop-types';
import { FaSpinner } from 'react-icons/lib/fa';

import FlowbokopGraphViewer from './FlowbokopGraphViewer';

const graphStates = {
  fetching: 'fetching',
  empty: 'empty',
  display: 'display',
  error: 'error',
};

const propTypes = {
  // scrollToId: PropTypes.string,
  graphState: PropTypes.string, // One of {'fetching', 'empty', 'display'}
  height: PropTypes.string,
  width: PropTypes.string,
  // callbackFetchGraph: PropTypes.func,
  graph: PropTypes.shape({
    nodes: PropTypes.array,
    edges: PropTypes.array,
  }).isRequired,
  nodeSelectCallback: PropTypes.func,
  edgeSelectCallback: PropTypes.func,
  // wait: ,
  // callbackRefresh: PropTypes.func,
  // concepts: ,
};

const defaultProps = {
  graphState: graphStates.display,
  height: null,
  width: null,
  nodeSelectCallback: () => {},
  edgeSelectCallback: () => {},
};

class FlowbokopGraphFetchAndView extends React.Component {
  constructor(props) {
    super(props);

    this.divId = 'FlowbokopGraphFetchContainer';

    this.getHeight = this.getHeight.bind(this);
    this.getWidth = this.getWidth.bind(this);
    // this.scrollGraphToTop = this.scrollGraphToTop.bind(this);
  }

  getHeight() {
    let h = $(window).height() - 50;
    return `${h}px`;
  }
  getWidth() {
    // let w = 500;
    let w = $(`#${this.divId}`).innerWidth();
    // Ask how big the parent div is?
    return `${w}px`;
  }
  // scrollGraphToTop() {
  //   $('html, body').animate(
  //     {
  //       scrollTop: $(this.props.scrollToId).offset().top - 3,
  //     },
  //     1000,
  //   );
  // }

  render() {
    const fetching = this.props.graphState === graphStates.fetching;
    const notInitialized = this.props.graphState === graphStates.empty;

    const showGraph = (!(this.props.graph === null) && (this.props.graphState === graphStates.display));
    const showFetching = fetching;

    // const panelExtraStyle = { margin: 0 };

    const height = this.props.height ? this.props.height : this.getHeight();
    const width = this.props.width ? this.props.width : this.getWidth();

    return (
      <div id={this.divId}>
        {showGraph &&
          <FlowbokopGraphViewer
            height={height}
            width={width}
            graph={this.props.graph}
            nodeSelectCallback={this.props.nodeSelectCallback}
            edgeSelectCallback={this.props.edgeSelectCallback}
          />
        }
        {showFetching &&
          <div style={{ margin: '15px', height, display: 'table', width: '100%' }}>
            <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
              <FaSpinner className="icon-spin" style={{ marginRight: '10px', verticalAlign: 'text-top' }} />
              Graph update in progress... Please wait.
            </div>
          </div>
        }
        {notInitialized &&
          <div style={{ margin: '15px', height, display: 'table', width: '100%' }}>
            <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
              Please setup input(s) to generate query graph.
            </div>
          </div>
        }
      </div>
    );
  }
}

FlowbokopGraphFetchAndView.propTypes = propTypes;
FlowbokopGraphFetchAndView.defaultProps = defaultProps;

export default FlowbokopGraphFetchAndView;
export { graphStates };
