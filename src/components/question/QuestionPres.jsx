import React from 'react';

import { Grid, Row, Col } from 'react-bootstrap';

import QuestionMetaEditor from './QuestionMetaEditor';
import QuestionGraphViewer from '../shared/QuestionGraphViewer';
import AnswersetTableAgGrid from './AnswersetTableAgGrid';
import QuestionToolbar from './QuestionToolbar';
import KnowledgeGraphFetchAndView from './KnowledgeGraphFetchAndView';

const shortid = require('shortid');

class QuestionPres extends React.Component {
  constructor(props) {
    super(props);

    this.callbackAnswerset = this.callbackAnswerset.bind(this);
  }

  callbackAnswerset(answerset) {
    window.open(this.props.answersetUrlFunc(answerset),'_self')
  }

  render() {
    const natural = this.props.question.natural_question;
    const {
      name,
      notes,
      hash,
    } = this.props.question;

    const construction = {
      edges: this.props.question.edges,
      nodes: this.props.question.nodes,
    };

    const userOwnsThisQuestion = this.props.question.user === this.props.user; // Fix Me

    return (
      <Grid>
        <Row>
          <Col md={6}>
            <QuestionMetaEditor
              callbackUpdate={this.props.callbackUpdateMeta}
              question={this.props.question}
            />
          </Col>
          <Col md={6}>
            <QuestionGraphViewer
              graph={construction}
            />
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <AnswersetTableAgGrid
              answersets={this.props.answersets}
              callbackRowClick={this.callbackAnswerset}
            />
          </Col>
          <Col md={6}>
            <QuestionToolbar
              question={this.props.question}
              enableDelete={userOwnsThisQuestion}
              callbackUpdate={this.props.callbackUpdate}
              callbackFork={this.props.callbackFork}
              callbackDelete={this.props.callbackDelete}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <KnowledgeGraphFetchAndView
              height="500px"
              width="500px"
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
