import React from 'react';
import PropTypes from 'prop-types';
import { FaSpinner, FaPlusSquare } from 'react-icons/fa';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Modal, Button } from 'react-bootstrap';

import MachineQuestionView from '../../shared/graphs/MachineQuestionView';
import NewQuestionPanelModal from '../panels/NewQuestionPanelModal';
import ButtonGroupPanel from './ButtonGroupPanel';
import MachineQuestionEditor from './MachineQuestionEditor';
import { panelTypes } from '../../../stores/newQuestionStore';

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
    this.graphClickCallback = this.graphClickCallback.bind(this);
    this.toggleJsonEditor = this.toggleJsonEditor.bind(this);
    this.saveJsonEditor = this.saveJsonEditor.bind(this);
  }

  // componentDidMount() {
  //   const { store } = this.props;
  //   if (store.graphState === graphStates.empty) setTimeout(() => store.newActivePanel(panelTypes.node), 1000);
  // }

  getHeight() {
    const h = window.innerHeight - 50;
    return `${h}px`;
  }

  getWidth() {
    // let w = 500;
    const w = document.getElementById(`${this.divId}`).innerWidth;
    // Ask how big the parent div is?
    return `${w}px`;
  }

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
    const numNodes = store.panelState.length;
    const error = store.graphState === graphStates.error;

    const height = this.props.height ? this.props.height : this.getHeight();
    const width = this.props.width ? this.props.width : this.getWidth();

    return (
      <div id={this.divId}>
        <ButtonGroupPanel store={store} toggleJsonEditor={this.toggleJsonEditor} />
        {showGraph ?
          <MachineQuestionView
            height={height}
            width={width}
            question={toJS(store.machineQuestion)}
            concepts={toJS(store.concepts)}
            graphState={toJS(store.graphState)}
            selectable
            graphClickCallback={this.graphClickCallback}
          />
          :
          <div
            style={{
              height, display: 'table', width: '100%',
            }}
          >
            <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
              {showFetching && (
                <div>
                  <FaSpinner className="icon-spin" style={{ marginRight: '10px', verticalAlign: 'text-top' }} />
                  Graph update in progress... Please wait.
                </div>
              )}
              {notInitialized &&
                <Button bsSize="large" onClick={() => store.newActivePanel(panelTypes.node)}>
                  <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{' Add Node'}
                </Button>
              }
              {error &&
                <span>
                  There was an error with the query graph specification
                </span>
              }
            </div>
          </div>
        }
        {(numNodes === 1 || numNodes === 2) &&
          <div style={{ position: 'absolute', top: '47%', right: '20%' }}>
            <Button bsSize="large" onClick={() => store.newActivePanel(numNodes === 1 ? panelTypes.node : panelTypes.edge)}>
              <FaPlusSquare style={{ verticalAlign: 'text-top' }} />{` Add ${numNodes === 1 ? 'Node' : 'Edge'}`}
            </Button>
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
