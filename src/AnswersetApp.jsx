import React from 'react';

import { Grid, Row, Col, Button } from 'react-bootstrap';
import Dropzone from 'react-dropzone';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Loading from './components/Loading';
import AnswersetPres from './components/answerset/AnswersetPres';

class Answerset extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      isValid: false,
      user: {},
      answerset: {},
      answers: [],
      answerCount: null,
      answersetGraph: {},
    };
  }

  componentDidMount() {
    // makes the appropriate GET request from server.py,
    // uses the result to set this.state
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
  }

  onDrop(acceptedFiles, rejectedFiles) {
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const object = JSON.parse(fileContents);
          console.log(object);

          const d = new Date(object.datetime);
          object.timestamp = d.toISOString();
          this.setState({
            answerset: object,
            answers: object.result_list,
            question: {
              natural_question: object.original_question_text,
              description: object.restated_question_text,
            },
            isValid: true,
          })

        } catch(err) {
          window.alert('Failed to this Answerset File. Are you sure this is valid?');
          console.log(err);
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file');
      }
      fr.readAsText(file);

    });
  }

  renderLoading() {
    return (
      <Loading />
    );
  }
  renderBodyUpload() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <h1>
              Robokop Generalized Answerset Browser
            </h1>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Dropzone
              onDrop={(acceptedFiles, rejectedFiles) => this.onDrop(acceptedFiles, rejectedFiles) }
              multiple={false}
              style={{ width: 'calc(100%-50px)', height: '200px', backgroundColor: this.appConfig.colors.blue, border: 'none', padding: '10px', margin: '25px', textAlign: 'center',  }}
            >
              <div>
                <h2>
                  Drag and drop your answer set file, or click to browse.
                </h2>
              </div>
            </Dropzone>
          </Col>
        </Row>
      </Grid>
    );
  }
  renderBodyValid() {
    return (
      /* <AnswersetPres
          user={this.state.user}
          question={this.state.question}
          answerset={this.state.answerset}
          answerId={this.props.answerId}
          answers={this.state.answers}
          answerCount={this.state.answerCount}
          answersetGraph={this.state.answersetGraph}
          answersetFeedback={this.state.answersetFeedback}
          otherQuestions={this.state.otherQuestions}
          otherAnswersets={this.state.otherAnswersets}
          callbackAnswersetSelect={a => this.appConfig.redirect(this.appConfig.urls.answerset(this.state.question.id, a.id))}
          callbackQuestionSelect={q => this.appConfig.redirect(this.appConfig.urls.question(q.id))}
          callbackAnswerSelect={a => this.appConfig.replaceUrl('Robokop - Answers', this.appConfig.urls.answer(this.state.question.id, this.state.answerset.id, a.id))}
          callbackNoAnswerSelect={() => this.appConfig.replaceUrl('Robokop - Answers', this.appConfig.urls.answerset(this.state.question.id, this.state.answerset.id))}
          callbackFeedbackSubmit={this.callbackFeedbackSubmit}
        /> */
      <div>
        We are good to go!
      </div>
    );
  }
  renderLoaded() {
    const { isValid } = this.state;
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        {!isValid && this.renderBodyUpload()}
        {isValid && this.renderBodyValid()}
      </div>
    );
  }
  render() {
    const ready = this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default Answerset;
