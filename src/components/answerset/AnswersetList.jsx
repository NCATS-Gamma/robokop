import React from 'react';
import { Row, Col, Panel, FormControl } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import Fuse from 'fuse-js-latest';
import { toJS, observable, action, runInAction, computed } from 'mobx';
import { observer } from 'mobx-react';

import AnswerExplorer from '../shared/AnswerExplorer';

const _ = require('lodash');

@observer
class AnswersetList extends React.Component {
  fuseOptions = {
    // shouldSort: true,
    tokenize: true,
    matchAllTokens: false,
    findAllMatches: true,
    threshold: 0,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['names'],
  };
  @observable filterText = '';
  @observable selectedSubGraphIndex = 0;
  @computed get answersWithInds() { // eslint-disable-line react/sort-comp
    const answers = _.cloneDeep(this.props.answers);
    answers.forEach((ans, i) => (ans.ans_ind = i));
    return answers;
  }
  @computed get answersAsFuseList() {
    return this.answersWithInds.map(ans => ({ ans_ind: ans.ans_ind, names: ans.result_graph.node_list.map(n => n.name) }));
  }
  @computed get fuse() {
    return new Fuse(this.answersAsFuseList, this.fuseOptions);
  }
  @computed get filteredAnswers() { // eslint-disable-line react/sort-comp
    if (this.filterText === '') { // Return all answers if filterText is blank
      return this.answersWithInds;
    }
    const filtFuseResultInds = this.fuse.search(this.filterText).map(res => res.ans_ind);
    // // Return filtered answers in sort order as provided by Fuse
    // const filtAnswers = [];
    // filtFuseResultInds.forEach((ind) => {
    //   filtAnswers.push(this.answersWithInds.filter(ans => ans.ans_ind === ind)[0]);
    // });
    const filtAnswers = this.answersWithInds.filter(ans => filtFuseResultInds.includes(ans.ans_ind));
    return filtAnswers;
  }

  @action.bound updateSelectedSubGraphIndex(ind) {
    this.props.callbackAnswerSelected(toJS(this.filteredAnswers[ind]));
    this.list.scrollToRow(ind);

    this.list.forceUpdateGrid();
    this.selectedSubGraphIndex = ind;
  }
  // Called when answerId from props changes... force reset of params
  @action.bound updateSelectedSubGraphIndexById(id) {
    let idIndex = this.filteredAnswers.findIndex(a => a.id === id);
    // Reset filter if supplied answerId not found in current filteredList
    // If Interactive selector results in an answerId being supplied, this
    // will ensure that the filter is reset if the answerId is not present
    // in the current filtered list
    if (idIndex === -1) {
      this.filterText = '';
      idIndex = this.filteredAnswers.findIndex(a => a.id === id);
    }
    if (idIndex > -1 && idIndex < this.answersWithInds.length) {
      this.updateSelectedSubGraphIndex(idIndex);
    }
  }

  constructor(props) {
    super(props);

    this.styles = {
      list: {
        border: 'none',
        marginTop: '0px',
        outline: 'none',
      },
      row: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '5px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        cursor: 'pointer',
      },
      letter: {
        display: 'inline-block',
        height: '40px',
        width: '40px',
        minWidth: '40px',
        lineHeight: '40px',
        textAlign: 'center',
        borderRadius: '40px',
        color: 'white',
        backgroundColor: '#b8c6db',
        fontSize: '1.5em',
        marginRight: '5px',
      },
      name: {
        height: '1.25em',
        fontWeight: 'bold',
        marginBottom: '2px',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
      },
      score: {
        color: '#333',
      },
    };

    this.noRowsRenderer = this.noRowsRenderer.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);

    this.onChangeFilterText = this.onChangeFilterText.bind(this);
  }

  componentDidMount() {
    if (this.props.answerId && Number.isSafeInteger(this.props.answerId)) {
      this.updateSelectedSubGraphIndexById(this.props.answerId);
    }
  }
  componentWillReceiveProps(newProps) {
    const answerIdEqual = _.isEqual(this.props.answerId, newProps.answerId); // Monitored for select by parameter or page load
    if (!answerIdEqual && newProps.answerId && Number.isSafeInteger(newProps.answerId)) {
      this.updateSelectedSubGraphIndexById(newProps.answerId);
    }
  }
  onChangeFilterText(event) {
    const filterText = event.target.value;
    runInAction(() => {
      this.filterText = filterText;
      this.updateSelectedSubGraphIndex(0);
    });
  }

  rowRenderer({
    index,
    isScrolling,
    key,
    style,
  }) {
    const answer = this.filteredAnswers[index];
    const isActive = index === this.selectedSubGraphIndex;
    const cScore = answer.confidence.toFixed(3);
    const cText = answer.text;

    const backgroundColorStyle = { backgroundColor: '#fff' };
    if (isActive) {
      backgroundColorStyle.backgroundColor = '#f5f7fa';
    }

    return (
      <div
        style={{ ...style, ...this.styles.row, ...backgroundColorStyle }}
        key={key}
        onClick={() => this.updateSelectedSubGraphIndex(index)}
      >
        <div style={this.styles.letter}>
          {`${answer.ans_ind + 1}`}
        </div>
        <div>
          <div style={this.styles.name}>
            {cText}
          </div>
          <div style={this.styles.score}>
            {cScore}
          </div>
        </div>
      </div>
    );
  }
  noRowsRenderer() {
    return (
      <Row>
        <Col md={12}>
          <h5>
            {"There doesn't seem to be any answers!?!"}
          </h5>
        </Col>
      </Row>
    );
  }

  render() {
    const listHeight = 500;
    const rowCount = this.filteredAnswers.length;

    const answer = this.filteredAnswers[this.selectedSubGraphIndex];
    const answerFeedback = this.props.answersetFeedback.filter(f => f.answer_id === answer.id);

    return (
      <Row>
        <Col md={3} style={{ paddingRight: '5px', marginTop: '10px' }}>
          <FormControl
            type="text"
            value={this.filterText}
            placeholder="Start typing to filter answers..."
            onChange={this.onChangeFilterText}
          />
          <Panel>
            <Panel.Heading>
              <Panel.Title componentClass="h3">Ranked Answers</Panel.Title>
            </Panel.Heading>
            <Panel.Body style={{ padding: 0 }}>
              <AutoSizer disableHeight defaultWidth={100}>
                {({ width }) => (
                  <List
                    ref={(ref) => { this.list = ref; }}
                    style={this.styles.list}
                    height={listHeight}
                    overscanRowCount={10}
                    rowCount={rowCount}
                    rowHeight={50}
                    noRowsRenderer={this.noRowsRenderer}
                    rowRenderer={this.rowRenderer}
                    width={width}
                  />
                )}
              </AutoSizer>
            </Panel.Body>
          </Panel>
        </Col>
        <Col md={9} style={{ paddingLeft: '5px', marginTop: '10px' }}>
          <AnswerExplorer
            user={this.props.user}
            answer={toJS(answer)}
            answerIndex={this.selectedSubGraphIndex}
            answerFeedback={answerFeedback}
            concepts={this.props.concepts}

            callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
            enableFeedbackView={this.props.enableFeedbackView}
            enableFeedbackSubmit={this.props.enableFeedbackSubmit}
            enabledAnswerLink={this.props.enabledAnswerLink}
            getAnswerUrl={this.props.getAnswerUrl}
          />
        </Col>
      </Row>
    );
  }
}

AnswersetList.defaultProps = {
  answersetFeedback: [],
  answers: [],
};


export default AnswersetList;
