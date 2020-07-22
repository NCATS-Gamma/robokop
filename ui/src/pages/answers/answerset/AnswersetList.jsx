import React from 'react';
import { Row, Col, Panel, FormControl } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import { toJS/* , observable, action, runInAction, computed */ } from 'mobx';
import { observer } from 'mobx-react';

import AnswerExplorer from '../shared/AnswerExplorer';

const _ = require('lodash');

@observer
class AnswersetList extends React.Component {
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
    this.updateSelectedSubGraphIndex = this.updateSelectedSubGraphIndex.bind(this);
    // Register callback to update react-virtualized list when subgraphInd changes in stroe
    this.props.store.registerUpdateSelectedSubGraphIndexCallback(this.updateSelectedSubGraphIndex);
  }

  componentDidMount() {
    if (this.props.answerId && Number.isSafeInteger(this.props.answerId)) {
      this.props.store.updateSelectedSubGraphIndexById(this.props.answerId);
    }
  }
  componentWillReceiveProps(newProps) {
    const answerIdEqual = _.isEqual(this.props.answerId, newProps.answerId); // Monitored for select by parameter or page load
    if (!answerIdEqual && newProps.answerId && Number.isSafeInteger(newProps.answerId)) {
      this.props.store.updateSelectedSubGraphIndexById(newProps.answerId);
    }
  }
  updateSelectedSubGraphIndex(ind) {
    this.props.callbackAnswerSelected(toJS(this.props.store.filteredAnswers[ind]));
    this.list.scrollToRow(ind);
    this.list.forceUpdateGrid();
  }
  onChangeFilterText(event) {
    const filterText = event.target.value;
    this.props.store.changeFilterText(filterText);
  }

  rowRenderer({
    index,
    key,
    style,
  }) {
    const { store } = this.props;
    const answer = store.filteredAnswers[index];
    const isActive = index === store.selectedSubGraphIndex;
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
        onClick={() => store.updateSelectedSubGraphIndex(index)}
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
    const { store } = this.props;
    const listHeight = 500;
    const rowCount = store.filteredAnswers.length;

    const answer = store.filteredAnswers[store.selectedSubGraphIndex];
    const answerFeedback = this.props.answersetFeedback.filter(f => f.answer_id === answer.id);

    return (
      <Row>
        <Col md={3} style={{ paddingRight: '5px', marginTop: '10px' }}>
          <FormControl
            type="text"
            value={store.filterText}
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
            answerIndex={store.selectedSubGraphIndex}
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
