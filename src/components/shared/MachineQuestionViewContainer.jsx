import React from 'react';
import PropTypes from 'prop-types';
import { FaSpinner } from 'react-icons/lib/fa';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Modal } from 'react-bootstrap';

import MachineQuestionView from './graphs/MachineQuestionView';
import NewQuestionPanelModal from './modals/NewQuestionPanelModal';
import ButtonGroupPanel from './ButtonGroupPanel';
import MachineQuestionEditor from './MachineQuestionEditor';

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

    this.state = {
      showJsonEditor: false,
    };

    this.divId = 'MachineQuestionViewContainer';

    this.getHeight = this.getHeight.bind(this);
    this.getWidth = this.getWidth.bind(this);
    // this.nodeSelectCallback = this.nodeSelectCallback.bind(this);
    // this.edgeSelectCallback = this.edgeSelectCallback.bind(this);
    this.graphClickCallback = this.graphClickCallback.bind(this);
    this.toggleJsonEditor = this.toggleJsonEditor.bind(this);
    this.saveJsonEditor = this.saveJsonEditor.bind(this);
  }

  getHeight() {
    const h = $(window).height() - 50;
    return `${h}px`;
  }

  getWidth() {
    // let w = 500;
    const w = $(`#${this.divId}`).innerWidth();
    // Ask how big the parent div is?
    return `${w}px`;
  }

  // nodeSelectCallback(data) {
  //   let nodeId = -1;
  //   if (data.nodes.length > 0) {
  //     nodeId = data.nodes[0]; // eslint-disable-line prefer-destructuring
  //   }
  //   if (nodeId > -1) {
  //     this.props.store.updateActivePanelFromNodeId(nodeId);
  //   }
  // }
  // edgeSelectCallback(data) {
  //   let edgeId = -1;
  //   if (data.edges.length > 0) {
  //     edgeId = data.edges[0]; // eslint-disable-line prefer-destructuring
  //   }
  //   if (edgeId > -1) {
  //     this.props.store.updateActivePanelFromEdgeId(edgeId);
  //   }
  // }

  graphClickCallback(data) {
    if (data.nodes.length > 0) {
      this.props.store.updateActivePanelFromNodeId(data.nodes[0]);
    } else if (data.edges.length > 0) {
      this.props.store.updateActivePanelFromEdgeId(data.edges[0]);
    }
  }

  toggleJsonEditor() {
    this.setState(prevState => ({ showJsonEditor: !prevState.showJsonEditor }));
  }

  saveJsonEditor({ data }) { // { data: this.state.data, isValid: this.state.isValid }
    const { store } = this.props;
    try {
      store.machineQuestionSpecToPanelState(data);
      this.toggleJsonEditor();
    } catch (err) {
      console.error(err);
      this.dialogMessage({
        title: 'Trouble Parsing Manually edited JSON',
        text: 'We ran in to problems parsing the user provided JSON. Please ensure that it is a valid MachineQuestion spec JSON file',
        buttonText: 'OK',
        buttonAction: () => {},
      });
      // window.alert('Failed to load m Question template. Are you sure this is valid?');
      store.setGraphState(graphStates.error);
    }
  }

  render() {
    const { store } = this.props;
    const { showJsonEditor } = this.state;
    const graph = toJS(store.machineQuestion);
    const showGraph = (!(graph === null) && (store.graphState === graphStates.display));
    const showFetching = store.graphState === graphStates.fetching;
    const notInitialized = store.graphState === graphStates.empty;
    const error = store.graphState === graphStates.error;

    const height = this.props.height ? this.props.height : this.getHeight();
    const width = this.props.width ? this.props.width : this.getWidth();

    return (
      <div id={this.divId}>
        <ButtonGroupPanel store={store} openJsonEditor={this.toggleJsonEditor} />
        {showGraph &&
          <MachineQuestionView
            height={height}
            width={width}
            question={toJS(store.machineQuestion)}
            concepts={toJS(store.concepts)}
            graphState={toJS(store.graphState)}
            selectable
            // nodeSelectCallback={this.nodeSelectCallback}
            // edgeSelectCallback={this.edgeSelectCallback}
            graphClickCallback={this.graphClickCallback}
          />
        }
        {showFetching &&
          <div style={{
            margin: '15px', height, display: 'table', width: '100%',
            }}
          >
            <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
              <FaSpinner className="icon-spin" style={{ marginRight: '10px', verticalAlign: 'text-top' }} />
              Graph update in progress... Please wait.
            </div>
          </div>
        }
        {notInitialized &&
          <div style={{
            margin: '15px', height, display: 'table', width: '100%',
            }}
          >
            <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
              Please setup nodes and edges to generate query graph.
            </div>
          </div>
        }
        {error &&
          <div style={{
            margin: '15px', height, display: 'table', width: '100%',
            }}
          >
            <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
              There was an error with the query graph specification
            </div>
          </div>
        }
        <NewQuestionPanelModal
          store={store}
        />
        <Modal
          bsSize="large"
          aria-labelledby="contained-modal-title-lg"
          show={showJsonEditor}
          dialogClassName="question-editor-modal"
        >
          <Modal.Body>
            <MachineQuestionEditor
              height={700}
              concepts={toJS(store.concepts)}
              question={store.questionName}
              machineQuestion={toJS(store.getMachineQuestionSpecJson.machine_question)}
              max_connectivity={store.max_connectivity}
              callbackSave={this.saveJsonEditor}
              callbackCancel={this.toggleJsonEditor}
            />
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

MachineQuestionViewContainer.propTypes = propTypes;
MachineQuestionViewContainer.defaultProps = defaultProps;

export default MachineQuestionViewContainer;
export { graphStates };
