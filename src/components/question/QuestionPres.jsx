import React from 'react';

import { Grid, Row, Col } from 'react-bootstrap';

import QuestionMetaEditor from './QuestionMetaEditor';
import QuestionGraphViewer from '../shared/QuestionGraphViewer';
import AnswersetBrowser from './AnswersetBrowser';
import QuestionToolbar from './QuestionToolbar';
import KnowledgeGraphFetchAndView from './KnowledgeGraphFetchAndView';

class QuestionPres extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      questionGraphContainer: {
        border: '1px solid #d1d1d1',
        boxShadow: '0px 0px 5px #c3c3c3',
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
    const enableEditing = (userOwnsThisQuestion && this.props.enableQuestionEdit) || this.props.user.is_admin
    const enableDelete = (userOwnsThisQuestion && this.props.enableQuestionDelete) || this.props.user.is_admin
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <QuestionToolbar
              question={this.props.question}
              enableDelete={enableEditing}
              callbackRefresh={this.props.callbackRefresh}
              callbackNewAnswerset={this.props.callbackNewAnswerset}
              callbackFork={this.props.callbackFork}
              callbackDelete={this.props.callbackDelete}

              showFork={this.props.enableQuestionFork}
              showRefresh={this.props.enableQuestionRefresh}
              showNewAnswerset={this.props.enableNewAnswersets}
              showDelete={enableDelete}
            />
          </Col>
        </Row>
        <Row style={{ minHeight: '250px', paddingTop: '10px' }}>
          <Col md={6}>
            <QuestionMetaEditor
              editable={enableEditing}
              callbackUpdate={this.props.callbackUpdateMeta}
              question={this.props.question}
            />
          </Col>
          <Col md={6}>
            <div>
              <h4>Machine Question</h4>
              <div style={this.styles.questionGraphContainer}>
                <QuestionGraphViewer
                  graph={questionGraph}
                />
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <AnswersetBrowser
              showNewButton={this.props.enableNewAnswersets}
              answersets={this.props.answersets}
              callbackAnswersetNew={this.props.callbackNewAnswerset}
              callbackAnswersetOpen={this.callbackAnswerset}
            />
          </Col>
        </Row>
        <Row style={{ paddingTop: '10px' }}>
          <Col md={12}>
            <KnowledgeGraphFetchAndView
              height="750px"
              width="750px"
              callbackFetchGraph={this.props.callbackFetchGraph}
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
