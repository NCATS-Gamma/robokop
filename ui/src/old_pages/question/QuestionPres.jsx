import React from 'react';

import { Grid, Row, Col, Popover, Panel, Button } from 'react-bootstrap';
import { GoPlaybackPlay } from 'react-icons/go';

import QuestionHeader from '../shared/QuestionHeader';
import QuestionGraphView from '../shared/graphs/QuestionGraphView';
import AnswersetList from './AnswersetList';
import Loading from '../Loading';
import HelpButton from '../shared/HelpButton';

const shortid = require('shortid');

class QuestionPres extends React.Component {
  constructor(props) {
    super(props);

    this.renderInitializerBusy = this.renderInitializerBusy.bind(this);
    this.renderAnswerRefreshBusy = this.renderAnswerRefreshBusy.bind(this);
    this.renderNoAnswerSets = this.renderNoAnswerSets.bind(this);
    this.renderPanelContents = this.renderPanelContents.bind(this);
    this.renderAllOkay = this.renderAllOkay.bind(this);
  }

  renderInitializerBusy() {
    return (
      <div style={{ display: 'table', width: '100%', minHeight: '200px' }}>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
          <h4>
            Getting Initial Answers. Please Wait.
          </h4>
          <Loading />
        </div>
      </div>
    );
  }

  renderAnswerRefreshBusy() {
    return (
      <div style={{ display: 'table', minHeight: '200px', width: '100%' }}>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
          <div>
            <h4>
              {this.props.answerBusy &&
                <span>
                  We are working on getting new answers for this question. Please wait.
                </span>
              }
              {this.props.refreshBusy &&
                <span>
                  We are working on updating the knowledge graph for this question. Please wait.
                </span>
              }
            </h4>
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  renderNoAnswerSets() {
    return (
      <div style={{ display: 'table', minHeight: '200px', width: '100%' }}>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center' }}>
          <h4>
            No answer sets available.
          </h4>
          <p>
            This may indicate a problem in the construction of the question, or a lack of available information.
          </p>
          <Button
            bsSize="large"
            alt="Get a New Answer Set"
            onClick={this.props.callbackNewAnswerset}
          >
            Get New Answers
            <br />
            <GoPlaybackPlay />
          </Button>
        </div>
      </div>
    );
  }

  renderAllOkay() {
    return (
      <AnswersetList
        question={this.props.question}
        answersets={this.props.answersets}
        answersetUrl={this.props.answersetUrl}
        concepts={this.props.concepts}
        callbackFetchAnswerset={this.props.callbackFetchAnswerset}
      />
    );
  }

  renderPanelContents() {
    const {
      refreshBusy, answerBusy, initializerBusy, answersets,
    } = this.props;
    const haveAnAnswerSet = answersets && Array.isArray(answersets) && answersets.length > 0;

    if (haveAnAnswerSet) {
      return this.renderAllOkay();
    }
    if (initializerBusy) {
      return this.renderInitializerBusy();
    }
    if (answerBusy || refreshBusy) {
      return this.renderAnswerRefreshBusy();
    }
    return this.renderNoAnswerSets();
  }

  render() {
    // console.log(this.props.question)
    const questionGraph = {
      edges: (('machine_question' in this.props.question) && this.props.question.machine_question && ('edges' in this.props.question.machine_question)) ? this.props.question.machine_question.edges : [],
      nodes: (('machine_question' in this.props.question) && this.props.question.machine_question && ('nodes' in this.props.question.machine_question)) ? this.props.question.machine_question.nodes : [],
    };

    const {
      owner, user, enableQuestionEdit, enableQuestionDelete,
    } = this.props;

    const userOwnsThisQuestion = owner === user.user_id;
    const userIsLoggedIn = user.is_authenticated;
    const enableEditing = (userOwnsThisQuestion && enableQuestionEdit) || user.is_admin;
    const enableDelete = (userOwnsThisQuestion && enableQuestionDelete) || user.is_admin;

    const enableNewAnswersets = (userIsLoggedIn && this.props.enableNewAnswersets) || this.props.user.is_admin;
    const enableQuestionRefresh = (userIsLoggedIn && this.props.enableQuestionRefresh) || this.props.user.is_admin;
    const enableQuestionFork = (userIsLoggedIn && this.props.enableQuestionFork) || this.props.user.is_admin;
    const enableTaskStatus = ((userIsLoggedIn && this.props.enableTaskStatus) || this.props.user.is_admin) && (this.props.refreshBusy || this.props.answerBusy);

    const questionGraphPopover = (
      <Popover id="qgraph-popover" title="Question Graph" style={{ minWidth: '650px' }}>
        <QuestionGraphView
          height={250}
          concepts={this.props.concepts}
          question={questionGraph}
          graphClickCallback={() => {}}
        />
      </Popover>
    );

    return (
      <Grid>
        <QuestionHeader
          question={this.props.question}
          showToolbar={userIsLoggedIn}
          questionGraphPopover={questionGraphPopover}
          user={this.props.user}
          refreshBusy={this.props.refreshBusy}
          answerBusy={this.props.answerBusy}
          initializerBusy={this.props.initializerBusy}

          callbackNewAnswerset={this.props.callbackNewAnswerset}
          callbackRefresh={this.props.callbackRefresh}
          callbackUpdate={this.props.callbackUpdateMeta}
          callbackFork={this.props.callbackFork}
          callbackTaskStatus={this.props.callbackTaskStatus}
          callbackDelete={this.props.callbackDelete}
          callbackQuestionVisibility={this.props.callbackQuestionVisibility}

          enableNewAnswersets={enableNewAnswersets}
          enableQuestionRefresh={enableQuestionRefresh}
          enableQuestionEdit={enableEditing}
          enableQuestionDelete={enableDelete}
          enableQuestionFork={enableQuestionFork}
          enableQuestionTask={enableQuestionFork}
          enableTaskStatus={enableTaskStatus}
        />
        <Row style={{ paddingTop: '15px' }}>
          <Col md={12}>
            <Panel id="localKGHeader">
              <Panel.Heading>
                <Panel.Title componentClass="h3">
                  {'Local Knowledge Graph for Selected Answer Set '}
                  <HelpButton link="knowledgeGraph" />
                </Panel.Title>
              </Panel.Heading>
              <Panel.Body style={{ padding: 0, minHeight: '300px' }}>
                {this.renderPanelContents()}
              </Panel.Body>
            </Panel>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default QuestionPres;
