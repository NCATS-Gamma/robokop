import React from 'react';

import { Button, Grid, Row, Col } from 'react-bootstrap';

import QuestionMetaEditor from './QuestionMetaEditor';
import QuestionGraphViewer from '../shared/QuestionGraphViewer';
import AnswersetTableAgGrid from './AnswersetTableAgGrid';
import QuestionToolbar from './QuestionToolbar';
import KnowledgeGraphFetchAndView from './KnowledgeGraphFetchAndView';

class QuestionPres extends React.Component {
  constructor(props) {
    super(props);

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

    const userOwnsThisQuestion = this.props.question.user === this.props.user.username; // Fix Me
    const enableEditing = userOwnsThisQuestion || this.props.user.is_admin;
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <QuestionToolbar
              question={this.props.question}
              enableDelete={enableEditing}
              callbackUpdate={this.props.callbackUpdate}
              callbackNewAnswerset={this.props.callbackNewAnswerset}
              callbackFork={this.props.callbackFork}
              callbackDelete={this.props.callbackDelete}
            />
          </Col>
        </Row>
        <Row style={{ minHeight: '300px', paddingTop: '10px' }}>
          <Col md={6}>
            <QuestionMetaEditor
              editable={enableEditing}
              callbackUpdate={this.props.callbackUpdateMeta}
              question={this.props.question}
            />
          </Col>
          <Col md={6}>
            <QuestionGraphViewer
              graph={questionGraph}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <AnswersetTableAgGrid
              answersets={this.props.answersets}
              callbackRowClick={this.callbackAnswerset}
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
