import React from 'react';

import AnswersetSelector from './AnswersetSelector';
import KnowledgeGraphViewer from './KnowledgeGraphViewer';

import AnswersetStore from './../../stores/messageAnswersetStore';

// const _ = require('lodash');

class AnswersetList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loadingAnswerset: true,
      loadedAnswersetId: null,
      loadedAnswerset: null,
      loadedKnowledgeGraph: null,
    };

    this.onAnswersetSelect = this.onAnswersetSelect.bind(this);
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
          // console.log('Fetched Answerset: ', data);
          const messagestore = new AnswersetStore(data);

          const answerset = data;
          const kg = messagestore.annotatedKnowledgeGraph;
          this.setState({
            loadingAnswerset: false,
            loadededAnswerset: answerset,
            loadedKnowledgeGraph: kg,
            loadedAnswersetId: aid,
          });
        },
        (err) => {
          console.log('error encountered fetching AS:', err);
          this.setState({
            loadingAnswerset: false,
            loadededAnswerset: null,
            loadedKnowledgeGraph: null,
            loadedAnswersetId: null,
          });
        },
      );
    });
  }

  getHeight() {
    const h = $(window).height() - 50;
    return `${h}px`;
  }
  getWidth() {
    let w = 500;
    w = $('#AnswersetListDiv').innerWidth();
    // Ask how big the parent div is?
    return `${w}px`;
  }

  render() {
    return (
      <div style={{ position: 'relative', minHeight: '200px', display: 'table', width: '100%', id: 'AnswersetListDiv' }}>
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
        <KnowledgeGraphViewer
          height={this.getHeight()}
          width={this.getWidth()}
          concepts={this.props.concepts}
          graph={this.state.loadedKnowledgeGraph}
          loading={this.state.loadingAnswerset}
        />
      </div>
    );
  }
}

export default AnswersetList;
