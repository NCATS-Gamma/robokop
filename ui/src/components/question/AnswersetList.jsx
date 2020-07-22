import React from 'react';
import { observer } from 'mobx-react';
import Slider from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import { OverlayTrigger, Popover, Checkbox } from 'react-bootstrap';
import { FaAngleDown } from 'react-icons/fa';

import AnswersetSelector from './AnswersetSelector';
import SubGraphViewer from '../shared/graphs/SubGraphViewer';

import AnswersetStore from './../../stores/messageAnswersetStore';
import Loading from '../Loading';

const shortid = require('shortid');

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
      overlayStyle={{ zIndex: 1061 }}
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
      hierarchical: '',
    };

    this.setGraphSize = this.setGraphSize.bind(this);
    this.onAnswersetSelect = this.onAnswersetSelect.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleHierarchical = this.handleHierarchical.bind(this);
  }

  componentDidMount() {
    this.setGraphSize();
  }

  setGraphSize() {
    const height = this.ansList.clientHeight;
    this.setState({ height });
  }

  handleSliderChange(value) {
    this.answersetStore.updateNumKGNodes(value);
  }

  handleHierarchical(checked) {
    const horizon = checked ? 'hierarchical' : '';
    this.setState({ hierarchical: horizon });
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
      height, loadingAnswerset, loadedAnswerset, hierarchical,
    } = this.state;
    let kg = {};
    let sliderPopover = <div>No answerset</div>;
    if (loadedAnswerset) {
      kg = this.answersetStore.annotatedPrunedKnowledgeGraph;
      sliderPopover = (
        <Popover id={shortid.generate()}>
          <div style={{ marginTop: '10px', width: '300px' }}>
            {this.answersetStore.isKgPruned() ? (
              `Pruned graph showing top ${this.answersetStore.numKGNodes} nodes`
            ) : (
              'Prune Graph'
            )}
            <Slider
              min={this.answersetStore.numQNodes}
              max={this.answersetStore.maxNumKGNodes}
              defaultValue={this.answersetStore.numKGNodes}
              onAfterChange={this.handleSliderChange}
              handle={handle}
            />
            <Checkbox checked={hierarchical} onChange={e => this.handleHierarchical(e.target.checked)}>Hierarchical</Checkbox>
          </div>
        </Popover>
      );
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
        <div style={{ height }}>
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
                  width: '270px',
                  backgroundColor: '#fff',
                  boxShadow: '-2px 2px 5px 0px #7777777d',
                  zIndex: 100,
                }}
              >
                <OverlayTrigger trigger={['click']} placement="bottom" rootClose overlay={sliderPopover}>
                  <div
                    style={{
                      width: '100%', textAlign: 'center', cursor: 'pointer', padding: '10px',
                    }}
                  >
                    Graph Options <FaAngleDown />
                  </div>
                </OverlayTrigger>
              </div>
              <SubGraphViewer
                subgraph={kg}
                concepts={this.props.concepts}
                layoutRandomSeed={Math.floor(Math.random() * 100)}
                showSupport={false}
                height={height}
                omitEdgeLabel
                callbackOnGraphClick={() => {}}
                layoutStyle={hierarchical}
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
