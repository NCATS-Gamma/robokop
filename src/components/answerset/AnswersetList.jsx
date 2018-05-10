import React from 'react';
import { Row, Col, PanelGroup, Panel } from 'react-bootstrap';
import { AutoSizer, List } from 'react-virtualized';
import SubGraphViewer from '../shared/SubGraphViewer';

const shortid = require('shortid');

class AnswersetList extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      list: {
        width: '100%',
        border: '1px solid #DDD',
        marginTop: '15px',
      },
      row: {
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0 25px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        cursor: 'pointer',
      },
      letter: {
        display: 'inline-block',
        height: '40px',
        width: '40px',
        lineHeight: '40px',
        textAlign: 'center',
        borderRadius: '40px',
        color: 'white',
        fontSize: '1.5em',
        marginRight: '25px',
      },
      name: {
        fontWeight: 'bold',
        marginBottom: '2px',
      },
      score: {
        color: '#37474f',
      },
    };

    this.state = {
      selectedSubGraphIndex: 0,
    };

    this.noRowsRenderer = this.noRowsRenderer.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);

    this.updateSelectedSubGraphIndex = this.updateSelectedSubGraphIndex.bind(this);
  }

  rowRenderer({index, isScrolling, key, style}) {
    const answer = this.props.answers[index];
    const isActive = index === this.state.selectedSubGraphIndex;
    const cScore = answer.confidence.toFixed(3);
    const cText = answer.text;

    const backgroundColorStyle = { backgroundColor: '#fff' };
    if (isActive) {
      backgroundColorStyle.backgroundColor = '#eee';
    }

    return (
      <div
        style={this.styles.row}
        key={key}
        onClick={() => this.updateSelectedSubGraphIndex(index)}
      >
        <div
          style={{ ...this.styles.letter, ...backgroundColorStyle }}
        >
          {index + 1}
        </div>
        <div>
          <div className={this.styles.name}>{cText}</div>
          <div className={this.styles.score}>{cScore}</div>
        </div>
      </div>
    );
  }
  noRowsRenderer() {
    return (
      <div>
        {"There doesn't seem to be any answers!?!"}
      </div>
    )
  }

  updateSelectedSubGraphIndex(ind) {
    this.setState({ selectedSubGraphIndex: ind });
  }
  render() {
    const listHeight = 500;
    const rowCount = this.props.answers.length;
    // scrollToIndex={scrollToIndex}
    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={3}>
              <AutoSizer disableHeight>
                {({ width }) => (
                  <List
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
            </Col>
            <Col md={9}>
              <SubGraphViewer
                subgraph={this.props.answers[this.state.selectedSubGraphIndex].result_graph}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}

export default AnswersetList;
