import React from 'react';

import { Grid, Row, Col, Popover, OverlayTrigger, Panel } from 'react-bootstrap';
import GoQuestion from 'react-icons/go/question';

import QuestionHeader from '../shared/QuestionHeader';
import QuestionGraphViewer from '../shared/QuestionGraphViewer';
import AnswersetSelector from './AnswersetSelector';
import KnowledgeGraphFetchAndView from './KnowledgeGraphFetchAndView';

const shortid = require('shortid');

class QuestionPres extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      questionGraphContainer: {
        minHeight: '300px',
      },
      answersetContainer: {
        minHeight: '300px',
      },
      rowTopPad: {
        paddingTop: '15px',
      },
    };
  }

  render() {
    const questionGraph = {
      edges: this.props.question.edges,
      nodes: this.props.question.nodes,
    };

    const userOwnsThisQuestion = this.props.owner === this.props.user.username; // Fix Me
    const userIsLoggedIn = this.props.user.is_authenticated;
    const enableEditing = (userOwnsThisQuestion && this.props.enableQuestionEdit) || this.props.user.is_admin;
    const enableDelete = (userOwnsThisQuestion && this.props.enableQuestionDelete) || this.props.user.is_admin;

    const enableNewAnswersets = (userIsLoggedIn && this.props.enableNewAnswersets) || this.props.user.is_admin;
    const enableQuestionRefresh = (userIsLoggedIn && this.props.enableQuestionRefresh) || this.props.user.is_admin;
    const enableQuestionFork = (userIsLoggedIn && this.props.enableQuestionFork) || this.props.user.is_admin;

    const machineQuestionHelp = (
      <Popover id="machineQuestionTooltip" key={shortid.generate()} title="Machine Question" style={{ minWidth: '500px' }}>
        <div style={{ textAlign: 'left' }}>
          <p>
            {'\
            The natural language question is interpretted into a sequences of steps through biological concepts. \
            We call this sequence of steps the "machine question". The machine question is used to find relevant\
            knowledge sources to add to the knolwedge graph and find potential answers.\
            '}
          </p>
          <br />
          <p>
            {'\
            After a question is created the machine question is fixed. The knowledge graph, however, is always evolving, \
            as are the sources we use to build on to the knolwedge graph. You can use this question to search for \
            information to add to the knowledge graph.\
            '
            }
          </p>
        </div>
      </Popover>
    );

    const answersetHelp = (
      <Popover id="answersetTooltip" key={shortid.generate()} title="Answer Set" style={{ minWidth: '500px' }}>
        <div style={{ textAlign: 'left' }}>
          <p>
            {'\
            The machine question defines a sequence of steps through the knowledge graph. Each possible path through \
            the knowledge graph that meets the requirements of the machine question is a potential answer. \
            An "answer set" is a collection of paths through the knowledge graph that have been ranked for relevance \
            and accuracy for this question. You can explore the answer set to find an answer that you believe or find interesting.\
            '}
          </p>
          <br />
          <p>
            {'\
            Because the knowledge graph is being updated as new knowledge sources are incorporated, new answer sets can \
            be found and they be different than the last time.\
            '}
          </p>
          <br />
          <p>
            {'\
            The list of available answersets for this question are listed below. More than likely the most recent one is the most relevant.\
            '
            }
          </p>
        </div>
      </Popover>
    );

    const knowledgeGraphHelp = (
      <Popover id="knowledgeGraphTooltip" key={shortid.generate()} title="Local Knowledge Graph" style={{ minWidth: '500px' }}>
        <div style={{ textAlign: 'left' }}>
          <p>
            {"\
            All of Robokop's knowledge is stored in a large knowledge graph. You can explore the local region of the knowledge graph that we think is relevant \
            to this question.\
            "}
          </p>
          <br />
          <p>
            {'\
            Even this small sub-graph might be quite large, so wait to load it until requested.\
            '
            }
          </p>
        </div>
      </Popover>
    );

    return (
      <Grid>
        <QuestionHeader
          question={this.props.question}
          showToolbar={userIsLoggedIn}

          refreshBusy={this.props.refreshBusy}
          answerBusy={this.props.answerBusy}
          initializerBusy={this.props.initializerBusy}

          callbackNewAnswerset={this.props.callbackNewAnswerset}
          callbackRefresh={this.props.callbackRefresh}
          callbackUpdate={this.props.callbackUpdateMeta}
          callbackFork={this.props.callbackFork}
          callbackDelete={this.props.callbackDelete}

          enableNewAnswersets={enableNewAnswersets}
          enableQuestionRefresh={enableQuestionRefresh}
          enableQuestionEdit={enableEditing}
          enableQuestionDelete={enableDelete}
          enableQuestionFork={enableQuestionFork}
        />
        <Row style={this.styles.rowTopPad}>
          <Col md={4}>
            <Panel style={this.styles.questionGraphContainer}>
              <Panel.Heading>
                <Panel.Title componentClass="h3">
                  Machine Question
                  <OverlayTrigger placement="right" overlay={machineQuestionHelp}>
                    <span> {'    '} <GoQuestion /> </span>
                  </OverlayTrigger>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body style={{ padding: 0 }}>
                <QuestionGraphViewer
                  graph={questionGraph}
                />
              </Panel.Body>
            </Panel>
          </Col>
          <Col md={8}>
            <Panel style={this.styles.answersetContainer}>
              <Panel.Heading>
                <Panel.Title componentClass="h3">
                  Answer Sets
                  <OverlayTrigger placement="right" overlay={answersetHelp}>
                    <span> {'    '} <GoQuestion /> </span>
                  </OverlayTrigger>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body>
                <AnswersetSelector
                  showNewButton={enableNewAnswersets}
                  enableNewButton={!this.props.answerBusy}
                  initializerBusy={this.props.initializerBusy}
                  answersets={this.props.answersets}
                  callbackAnswersetNew={this.props.callbackNewAnswerset}
                  callbackAnswersetOpen={this.props.callbackAnswersetOpen}
                />
              </Panel.Body>
            </Panel>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Panel id="localKGHeader">
              <Panel.Heading>
                <Panel.Title componentClass="h3">
                  Local Knowledge Graph
                  <OverlayTrigger placement="right" overlay={knowledgeGraphHelp}>
                    <span> {'    '} <GoQuestion /> </span>
                  </OverlayTrigger>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body style={{ padding: 0 }}>
                <KnowledgeGraphFetchAndView
                  callbackFetchGraph={this.props.callbackFetchGraph}
                  callbackRefresh={this.props.callbackRefresh}
                  subgraph={this.props.subgraph}
                  wait={this.props.refreshBusy}
                  scrollToId="#localKGHeader"
                />
              </Panel.Body>
            </Panel>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default QuestionPres;
