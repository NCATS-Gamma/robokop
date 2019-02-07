import React from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Grid, Tabs, Tab, Panel } from 'react-bootstrap';
import { toJS } from 'mobx';
import FaEye from 'react-icons/lib/fa/eye';
import FaEyeSlash from 'react-icons/lib/fa/eye-slash';

import QuestionHeader from '../shared/QuestionHeader';

import AnswersetGraph from './AnswersetGraph';
import MachineQuestionView2 from './../shared/MachineQuestionView2';
import MessageAnswersetTable from './MessageAnswersetTable';
import AnswersetStore from './../../stores/messageAnswersetStore';
import entityNameDisplay from './../util/entityNameDisplay';

export const answerSetTabEnum = {
  // answerList: 1,
  // interactive: 2,
  answerTable: 1,
  aggregate: 2,
};

/* eslint-disable no-param-reassign */
const nodePreProcFn = (n) => {
  n.isSet = ('set' in n) && (((typeof n.set === typeof true) && n.set) || ((typeof n.set === 'string') && n.set === 'true'));
  n.chosen = false; // Not needed since borderWidth manually set below
  n.borderWidth = 1;
  n.borderWidthSelected = 2;
  if (n.isSet) {
    n.borderWidth = 3;
    n.borderWidthSelected = 5;
  } else {
    n.borderWidth = 1;
  }
  if (n.isSelected) { // Override borderwidth when isSelected set by user thru props
    n.borderWidth = n.borderWidthSelected;
  }
  if (!('label' in n)) {
    if ('name' in n) {
      n.label = n.name;
    } else if (n.curie) {
      if (Array.isArray(n.curie)) {
        if (n.curie.length > 0) {
          n.label = n.curie[0]; // eslint-disable-line prefer-destructuring
        } else {
          n.label = '';
        }
      } else {
        n.label = n.curie;
      }
    } else if ('type' in n) {
      n.label = entityNameDisplay(n.type);
    } else {
      n.label = '';
    }
  }
  n.label = `${n.id}: ${n.label}`;
  return n;
};
/* eslint-enable no-param-reassign */

class MessageAnswersetPres extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: answerSetTabEnum.answerTable,
      graphVisible: true,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.onDownload = this.onDownload.bind(this);
    this.renderNoAnswers = this.renderNoAnswers.bind(this);
    this.renderAnswers = this.renderAnswers.bind(this);
    this.toggleGraphVisibility = this.toggleGraphVisibility.bind(this);

    this.answersetStore = new AnswersetStore(this.props.message);
    // console.log('MobX Answerset Store:', this.answersetStore);
  }
  onDownload() {
    const data = this.props.message;

    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // This doesn't use Blob() might also work
    // var url = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'answerset.json';
    a.href = url;
    a.click();
    a.remove();
  }

  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }

  toggleGraphVisibility() {
    this.setState(state => ({ graphVisible: !state.graphVisible }));
  }

  renderNoAnswers() {
    return (
      <Grid>
        <h4>
          No answers were found.
        </h4>
      </Grid>
    );
  }
  renderAnswers() {
    // const showOtherQuestions = this.props.otherQuestions.length > 0;
    // const showOtherAnswersets = this.props.otherQuestions.length > 0;
    const { message } = this.props;
    const answersetGraph = this.answersetStore.annotatedKnowledgeGraph;
    answersetGraph.node_list = answersetGraph.nodes;
    answersetGraph.edge_list = answersetGraph.edges;
    return (
      <div style={this.props.style}>
        {!this.props.omitHeader &&
        <Row>
          <Col md={12}>
            <QuestionHeader
              question={this.props.question}
              answerset={message}

              enableQuestionSelect={this.props.enableQuestionSelect}
              enableQuestionEdit={this.props.enableQuestionEdit}
              callbackUpdate={this.props.callbackQuestionUpdateMeta}
              callbackQuestionSelect={this.props.callbackQuestionSelect}
              urlQuestion={this.props.urlQuestion}

              callbackAnswersetSelect={this.props.callbackAnswersetSelect}
              urlAnswerset={this.props.urlAnswerset}

              showDownload
              callbackDownload={this.onDownload}
            />
          </Col>
        </Row>
        }
        <Row>
          <div className="col-md-12" style={{ height: '20px' }} />
          <Col md={12}>
            <Panel expanded={this.state.graphVisible} onToggle={() => {}} >
              <Panel.Heading>
                <Panel.Title>
                  {'Question Graph '}
                  <div style={{ position: 'relative', float: 'right', top: '-3px' }}>
                    <button
                      style={{ padding: '2px', marginLeft: '5px' }}
                      className="btn btn-default"
                      title="Toggle visibility of Question graph"
                      onClick={this.toggleGraphVisibility}
                    >
                      <span style={{ fontSize: '22px' }}>
                        {!this.state.graphVisible && <FaEye style={{ cursor: 'pointer' }} />}
                        {this.state.graphVisible && <FaEyeSlash style={{ cursor: 'pointer' }} />}
                      </span>
                    </button>
                  </div>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Collapse>
                <Panel.Body style={{ padding: '0px' }}>
                  <MachineQuestionView2
                    height={200}
                    // width={width}
                    question={toJS(this.answersetStore.message.question_graph)}
                    concepts={this.props.concepts}
                    graphState="display"
                    selectable
                    nodePreProcFn={nodePreProcFn}
                    // nodeSelectCallback={this.nodeSelectCallback}
                    // edgeSelectCallback={this.edgeSelectCallback}
                  />
                </Panel.Body>
              </Panel.Collapse>
            </Panel>
          </Col>
        </Row>
        <Tabs
          activeKey={this.state.tabKey}
          onSelect={this.handleTabSelect}
          animation
          id="answerset_tabs"
          mountOnEnter
        >
          {/* <Tab
            eventKey={answerSetTabEnum.answerList}
            title="Answers List"
          >
            <AnswersetList
              user={this.props.user} // Needed to parse feedback to know what is yours
              answers={this.props.answers}
              answersetFeedback={this.props.answersetFeedback}
              answerId={this.props.answerId} // Monitored for select by parameter or page load
              concepts={this.props.concepts}

              enableUrlChange={this.props.enableUrlChange}
              enableFeedbackSubmit={this.props.enableFeedbackSubmit}
              enableFeedbackView={this.props.enableFeedbackView}

              callbackAnswerSelected={this.props.callbackAnswerSelected}
              callbackNoAnswerSelected={this.props.callbackNoAnswerSelected}
              callbackFeedbackSubmit={this.props.callbackFeedbackSubmit}
              enabledAnswerLink={this.props.enabledAnswerLink}
              getAnswerUrl={this.props.getAnswerUrl}

              store={this.answersetStore}
            />
          </Tab> */}
          <Tab
            eventKey={answerSetTabEnum.answerTable}
            title="Answers Table"
          >
            {/* <div style={{ height: '300px', border: '1px solid #ddd' }}>Placeholder!</div> */}
            <MessageAnswersetTable
              // message={message}
              concepts={this.props.concepts}
              // callbackAnswerSelected={this.props.callbackAnswerSelected}
              store={this.answersetStore}
              handleTabSelect={this.handleTabSelect}
            />
          </Tab>
          <Tab
            eventKey={answerSetTabEnum.aggregate}
            title="Aggregate Graph"
          >
            <AnswersetGraph
              answersetGraph={answersetGraph}
              concepts={this.props.concepts}
            />
          </Tab>
        </Tabs>
      </div>
    );
  }
  render() {
    const { message } = this.props;
    const hasAnswers = message.answers && Array.isArray(message.answers) && message.answers.length > 0;
    return (
      <div>
        {!hasAnswers && this.renderNoAnswers()}
        {hasAnswers && this.renderAnswers()}
      </div>
    );
  }
}


MessageAnswersetPres.defaultProps = {
  enableUrlChange: false,
  enableQuestionSelect: false,
  enableFeedbackSubmit: false,
  enableFeedbackView: false,

  omitHeader: false,
  question: {},

  callbackNoAnswerSelected: () => {},
  callbackAnswerSelected: () => {},
  callbackAnswersetSelect: () => {},
  callbackQuestionSelect: () => {},
  callbackFeedbackSubmit: () => {},
  callbackQuestionUpdateMeta: () => {},
  urlQuestion: () => {},
  urlAnswerset: () => {},

  otherQuestions: [],
  otherAnswersets: [],

  answerId: [],
  answersetGraph: { nodes: [], edges: [] },

  enabledAnswerLink: false,
  getAnswerUrl: () => '',

  style: {},
};

MessageAnswersetPres.propTypes = {
  enableUrlChange: PropTypes.bool,
  enableQuestionSelect: PropTypes.bool,
  enableFeedbackSubmit: PropTypes.bool,
  enableFeedbackView: PropTypes.bool,

  omitHeader: PropTypes.bool,

  callbackNoAnswerSelected: PropTypes.func,
  callbackAnswerSelected: PropTypes.func,
  callbackAnswersetSelect: PropTypes.func,
  callbackQuestionSelect: PropTypes.func,
  callbackFeedbackSubmit: PropTypes.func,
  urlQuestion: PropTypes.func,
  urlAnswerset: PropTypes.func,

  // otherQuestions: PropTypes.arrayOf(PropTypes.object),
  // otherAnswersets: PropTypes.arrayOf(PropTypes.object),

  answerId: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),

  user: PropTypes.object.isRequired,
  question: PropTypes.object,

  message: PropTypes.shape({
    question_graph: PropTypes.shape({
      nodes: PropTypes.arrayOf(PropTypes.object),
      edges: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    knowledge_graph: PropTypes.shape({
      nodes: PropTypes.arrayOf(PropTypes.object),
      edges: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    answers: PropTypes.arrayOf(PropTypes.shape({
      edge_bindings: PropTypes.object.isRequired,
      node_bindings: PropTypes.object.isRequired,
      score: PropTypes.number,
    })).isRequired, // ISO Timestamp
  }).isRequired,

  // answers: PropTypes.arrayOf(PropTypes.object).isRequired,
  // answersetGraph: PropTypes.shape({
  //   nodes: PropTypes.arrayOf(PropTypes.object),
  //   edges: PropTypes.arrayOf(PropTypes.object),
  // }),

  enabledAnswerLink: PropTypes.bool,
  getAnswerUrl: PropTypes.func,

  style: PropTypes.object,
};

export default MessageAnswersetPres;
