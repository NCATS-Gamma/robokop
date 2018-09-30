import React from 'react';
import PropTypes from 'prop-types';
import { FaSpinner } from 'react-icons/lib/fa';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';

import MachineQuestionView2 from './MachineQuestionView2';

const graphStates = {
  fetching: 'fetching',
  empty: 'empty',
  display: 'display',
  error: 'error',
};

const propTypes = {
  height: PropTypes.string,
  width: PropTypes.string,
};

const defaultProps = {
  height: null,
  width: '100%',
};

@inject(({ store }) => ({ store }))
@observer
class MachineQuestionViewContainer extends React.Component {
  constructor(props) {
    super(props);

    this.divId = 'MachineQuestionViewContainer';

    this.getHeight = this.getHeight.bind(this);
    this.getWidth = this.getWidth.bind(this);
    this.nodeSelectCallback = this.nodeSelectCallback.bind(this);
    this.edgeSelectCallback = this.edgeSelectCallback.bind(this);
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
  nodeSelectCallback(data) {
    let nodeId = -1;
    if (data.nodes.length > 0) {
      nodeId = data.nodes[0]; // eslint-disable-line prefer-destructuring
    }
    if (nodeId > -1) {
      this.props.store.updateActivePanelFromNodeId(nodeId);
    }
  }
  edgeSelectCallback(data) {
    let edgeId = -1;
    if (data.edges.length > 0) {
      edgeId = data.edges[0]; // eslint-disable-line prefer-destructuring
    }
    if (edgeId > -1) {
      this.props.store.updateActivePanelFromEdgeId(edgeId);
    }
  }

  render() {
    const { store } = this.props;
    const graph = toJS(store.machineQuestion);
    const showGraph = (!(graph === null) && (store.graphState === graphStates.display));
    const showFetching = store.graphState === graphStates.fetching;
    const notInitialized = store.graphState === graphStates.empty;
    const error = store.graphState === graphStates.error;

    const height = this.props.height ? this.props.height : this.getHeight();
    const width = this.props.width ? this.props.width : this.getWidth();

    return (
      <div id={this.divId}>
        {showGraph &&
          <MachineQuestionView2
            height={height}
            width={width}
            question={toJS(store.machineQuestion)}
            concepts={toJS(store.concepts)}
            graphState={toJS(store.graphState)}
            selectable
            nodeSelectCallback={this.nodeSelectCallback}
            edgeSelectCallback={this.edgeSelectCallback}
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
              Please setup nodes and edges to generate query graph.
            </div>
          </div>
        }
        {error &&
          <div style={{ margin: '15px', height, display: 'table', width: '100%' }}>
            <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
              There was an error with the query graph specification
            </div>
          </div>
        }
      </div>
    );
  }
}

MachineQuestionViewContainer.propTypes = propTypes;
MachineQuestionViewContainer.defaultProps = defaultProps;

export default MachineQuestionViewContainer;
export { graphStates };
