import React from 'react';
import { Row, Col, Panel } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import AnswerExplorer from '../shared/AnswerExplorer';

class AnswersetList extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      list: {
        border: '1px solid #DDD',
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

    this.state = {
      selectedSubGraphIndex: 0,
    };

    this.noRowsRenderer = this.noRowsRenderer.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);

    this.updateSelectedSubGraphIndex = this.updateSelectedSubGraphIndex.bind(this);
  }

  rowRenderer({
    index,
    isScrolling,
    key,
    style,
  }) {
    const answer = this.props.answers[index];
    const isActive = index === this.state.selectedSubGraphIndex;
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
          {`${index + 1}`}
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

  updateSelectedSubGraphIndex(ind) {
    this.props.callbackAnswerSelected(this.props.answers[ind]);
    this.list.scrollToRow(ind);

    this.list.forceUpdateGrid();
    this.setState({ selectedSubGraphIndex: ind });
  }

  render() {
    const listHeight = 500;
    const rowCount = this.props.answers.length;

    const answer = this.props.answers[this.state.selectedSubGraphIndex];
    const answerFeedback = { answerId: answer.id, accuracy: 4, impact: 3, notes: 'This is a great answer' };

    return (
      <Row>
        <Col md={3} style={{ paddingRight: 0 }}>
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
        <Col md={9} style={{ paddingLeft: 0 }}>
          <AnswerExplorer
            answer={answer}
            answerIndex={this.state.selectedSubGraphIndex}
            feedback={answerFeedback}

            callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
            enableFeedbackSubmit={this.props.enableFeedbackSubmit}
          />
        </Col>
      </Row>
    );
  }
}

export default AnswersetList;
