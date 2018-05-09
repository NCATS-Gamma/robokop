import React from 'react';
import { Row, Col, PanelGroup, Panel } from 'react-bootstrap';
import { List } from 'react-virtualized';
import SubGraphViewer from '../shared/SubGraphViewer';

const shortid = require('shortid');

class AnswersetList extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      mainContent: {
        height: '70vh',
        border: '1px solid #d1d1d1',
        overflow: 'hidden',
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
      },
      listGroup: {
        paddingLeft: '2px',
        paddingRight: '2px',
        height: '100%',
        overflow: 'auto',
      },
      graph: {
        paddingLeft: '0',
        paddingRight: '0',
        height: '100%',
        overflow: 'auto',
      },
      explorer: {
        height: '100%',
        overflow: 'auto',
      },
    };
    this.state = {
      selectedSubGraphIndex: 0,
    };

    this.updateSelectedSubGraphIndex = this.updateSelectedSubGraphIndex.bind(this);
  }

  rowRender() {
    const listEntries = this.props.answers.map((s, ind) => {
      const isActive = ind === this.state.selectedSubGraphIndex;
      let bsStyle = 'default';
      if (isActive) {
        bsStyle = 'primary';
      }
      const cScore = s.confidence.toFixed(3);
      return (
        <Panel
          key={shortid.generate()}
          bsStyle={bsStyle}
          onClick={() => this.updateSelectedSubGraphIndex(ind)}
          style={{ cursor: 'pointer' }}
        >
          <Panel.Heading>
            <Panel.Title>
              {`${ind + 1} - ${s.text}`}
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            {`Score: ${cScore}`}
          </Panel.Body>
        </Panel>
        // </ListGroupItem>
      );
    });

    return (
      <PanelGroup id="Answers" key={shortid.generate()}>
        {listEntries}
      </PanelGroup>
    );
  }
  updateSelectedSubGraphIndex(ind) {
    this.setState({ selectedSubGraphIndex: ind });
  }
  render() {
    return (
      <Row>
        <Col md={12}>
          <Row>
            <Col md={3}>
              {this.rowRender()}
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
