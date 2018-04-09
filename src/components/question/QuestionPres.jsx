import React from 'react';

import { Grid, Row, Col, PageHeader } from 'react-bootstrap';

import QuestionHeader from './QuestionHeader';
import QuestionGraphViewer from '../shared/QuestionGraphViewer';
import AnswersetSelector from './AnswersetSelector';
import KnowledgeGraphFetchAndView from './KnowledgeGraphFetchAndView';

class QuestionPres extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      questionGraphContainer: {
        border: '1px solid #d1d1d1',
        // boxShadow: '0px 0px 5px #c3c3c3',
        margin: 'auto',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    };

    this.callbackAnswerset = this.callbackAnswerset.bind(this);
  }

  callbackAnswerset(answerset) {
    window.open(this.props.answersetUrlFunc(answerset), '_self');
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

    return (
      <Grid>
        <QuestionHeader
          question={this.props.question}
          showToolbar={userIsLoggedIn}

          refreshActive={this.props.refreshActive}
          refreshQueued={this.props.refreshQueued}
          answerActive={this.props.answerActive}
          answerQueued={this.props.answerQueued}

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
        <Row style={{ minHeight: '250px' }}>
          <Col md={4}>
            <h4>Machine Question</h4>
            <div style={this.styles.questionGraphContainer}>
              <QuestionGraphViewer
                graph={questionGraph}
              />
            </div>
          </Col>
          <Col md={8}>
            <h4>Answer Sets</h4>
            <AnswersetSelector
              showNewButton={enableNewAnswersets}
              answersets={this.props.answersets}
              callbackAnswersetNew={this.props.callbackNewAnswerset}
              callbackAnswersetOpen={this.callbackAnswerset}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <KnowledgeGraphFetchAndView
              height="750px"
              width="750px"
              callbackFetchGraph={this.props.callbackFetchGraph}
              callbackRefresh={this.props.callbackRefresh}
              subgraph={this.props.subgraph}
            />
          </Col>
        </Row>
      </Grid>
    );
  }
}

// answerHrefFunc - function
// question.natural_question;
//     const {
//       name,
//       user,
//       notes,
//       hash,
// edges: this.props.question.edges,
// nodes: this.props.question.nodes,
// answersets

export default QuestionPres;
