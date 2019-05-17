import React from 'react';

import AnswersetSelector from './AnswersetSelector';
// import KnowledgeGraphViewer from './KnowledgeGraphViewer';
import SubGraphViewer from '../shared/graphs/SubGraphViewer';

import AnswersetStore from './../../stores/messageAnswersetStore';
import Loading from '../Loading';

class AnswersetList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loadingAnswerset: true,
      loadedAnswersetId: null,
      loadedAnswerset: null,
      loadedKnowledgeGraph: null,
      isKgPruned: false,
      pruneMaxNumNodes: null,
    };

    this.onAnswersetSelect = this.onAnswersetSelect.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    const propsAllMatch = (newProps.answersets.length === this.props.answersets.length);
    const stateAllMatch = (newState.loadingAnswerset === this.state.loadingAnswerset);
    return !(propsAllMatch && stateAllMatch);
  }

  onAnswersetSelect(aid) {
    // Set loading state of KG Fetch
    // Start loading answerset
    // Process into knowledge graph
    // set state

    if (aid === this.state.loadedAnswersetId) {
      return;
    }

    // console.log('Please fetch KG for: ', aid);

    this.setState({ loadingAnswerset: true }, () => {
      this.props.callbackFetchAnswerset(
        aid,
        (data) => {
          const messagestore = new AnswersetStore(data);

          const answerset = data;
          const kg = messagestore.annotatedPrunedKnowledgeGraph;
          kg.node_list = kg.nodes;
          kg.edge_list = kg.edges;
          delete kg.nodes;
          delete kg.edges;

          this.setState({
            loadingAnswerset: false,
            loadedAnswerset: answerset,
            loadedKnowledgeGraph: kg,
            loadedAnswersetId: aid,
            isKgPruned: messagestore.isKgPruned(),
            pruneMaxNumNodes: messagestore.maxNumNodes,
          });
        },
        (err) => {
          console.log('error encountered fetching AS:', err);
          this.setState({
            loadingAnswerset: false,
            loadedAnswerset: null,
            loadedKnowledgeGraph: null,
            loadedAnswersetId: null,
          });
        },
      );
    });
  }

  getHeight() {
    const h = $(window).height() - 350;
    return `${h}px`;
  }
  getWidth() {
    let w = 500;
    w = $('#answersetList').innerWidth();
    // Ask how big the parent div is?
    return `${w}px`;
  }

  render() {
    const height = this.getHeight();
    const width = this.getWidth();
    return (
      <div
        id="answersetList"
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
          {this.state.loadingAnswerset &&
            <div>
              <Loading
                message={<p style={{ textAlign: 'center' }}>Loading Knowledge Graph</p>}
              />
            </div>
          }
          {this.state.loadedAnswerset && !this.state.loadingAnswerset &&
            <div>
              {this.state.isKgPruned && <span style={{ float: 'right', padding: '0 10px' }}>{`Pruned graph showing top ${this.state.pruneMaxNumNodes} nodes`}</span>}
              <SubGraphViewer
                subgraph={this.state.loadedKnowledgeGraph}
                concepts={this.props.concepts}
                layoutRandomSeed={Math.floor(Math.random() * 100)}
                showSupport={false}
                height={height}
                omitEdgeLabel
                callbackOnGraphClick={() => {}}
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

export default AnswersetList;
