import React from 'react';
import { observer } from 'mobx-react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';

import AnswersetSelector from './AnswersetSelector';
import SubGraphViewer from '../shared/graphs/SubGraphViewer';

import AnswersetStore from './../../stores/messageAnswersetStore';
import Loading from '../Loading';

const { Handle } = Slider;

const handle = (props) => {
  const {
    value, dragging, index, ...restProps
  } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={`${value} Nodes`}
      visible={dragging}
      placement="top"
      key={index}
      overlayStyle={{ zIndex: 101 }}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  );
};

@observer
class AnswersetList extends React.Component {
  constructor(props) {
    super(props);

    this.answersetStore = null;

    this.state = {
      loadingAnswerset: true,
      loadedAnswersetId: null,
      loadedAnswerset: false,
      height: 400,
      width: 1000,
    };

    this.setGraphSize = this.setGraphSize.bind(this);
    this.onAnswersetSelect = this.onAnswersetSelect.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
  }

  componentDidMount() {
    this.setGraphSize();
  }

  setGraphSize() {
    const height = this.ansList.clientHeight;
    const width = this.ansList.clientWidth;
    this.setState({ height, width });
  }

  handleSliderChange(value) {
    this.answersetStore.updateNumKGNodes(value);
  }

  onAnswersetSelect(aid) {
    // Set loading state of KG Fetch
    // Start loading answerset
    // Process into knowledge graph
    // set state

    if (aid === this.state.loadedAnswersetId) {
      return;
    }

    this.setState({ loadingAnswerset: true }, () => {
      this.props.callbackFetchAnswerset(
        aid,
        (data) => {
          this.answersetStore = new AnswersetStore(data);

          this.setState({
            loadingAnswerset: false,
            loadedAnswerset: true,
          });
        },
        (err) => {
          console.log('error encountered fetching AS:', err);
          this.setState({
            loadingAnswerset: false,
            loadedAnswerset: false,
          });
        },
      );
    });
  }

  render() {
    const {
      height, width, loadingAnswerset, loadedAnswerset,
    } = this.state;
    let kg = {};
    if (loadedAnswerset) {
      kg = this.answersetStore.annotatedPrunedKnowledgeGraph;
      kg.node_list = kg.nodes;
      kg.edge_list = kg.edges;
      delete kg.nodes;
      delete kg.edges;
    }
    return (
      <div
        id="answersetList"
        ref={(ansList) => { this.ansList = ansList; }}
        style={{
          position: 'relative', minHeight: '200px', display: 'table', width: '100%',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          padding: '20px',
          backgroundColor: '#fff',
          boxShadow: '2px 2px 5px 0px #7777777d',
          zIndex: 100,
          }}
        >
          <AnswersetSelector
            question={this.props.question}
            answersets={this.props.answersets}
            answersetUrl={this.props.answersetUrl}
            callbackOnSelect={aid => this.onAnswersetSelect(aid)}
          />
        </div>
        <div
          style={{
            height,
            width,
          }}
        >
          {loadingAnswerset &&
            <div>
              <Loading
                message={<p style={{ textAlign: 'center' }}>Loading Knowledge Graph</p>}
              />
            </div>
          }
          {loadedAnswerset && !loadingAnswerset &&
            <div>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '300px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  boxShadow: '-2px 2px 5px 0px #7777777d',
                  zIndex: 100,
                }}
              >
                {this.answersetStore.isKgPruned() ?
                  <span>Pruned graph showing top {this.answersetStore.numKGNodes} nodes</span>
                  :
                  <span>Aggregate Graph</span>
                }
                <div style={{ marginTop: '10px' }}>
                  <Slider
                    min={0}
                    max={this.answersetStore.maxNumKGNodes}
                    defaultValue={this.answersetStore.numKGNodes}
                    onAfterChange={this.handleSliderChange}
                    handle={handle}
                  />
                </div>
              </div>
              <SubGraphViewer
                subgraph={kg}
                concepts={this.props.concepts}
                layoutRandomSeed={Math.floor(Math.random() * 100)}
                showSupport={false}
                height={height}
                omitEdgeLabel
                callbackOnGraphClick={() => {}}
              />
            </div>
          }
          {!loadedAnswerset && !loadingAnswerset &&
            <div
              style={{
                display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center',
              }}
            >
              <h3>Sorry, something went wrong. Please pick a different answerset.</h3>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default AnswersetList;
