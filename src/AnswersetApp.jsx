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
      question: {},
      answerset: {},
      answers: [],
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

          const answerset = { // These are the required fields for our question header
            creator: object.tool_version,
            timestamp: object.timestamp,
          };

          const question = { // These are the required fields for our question header
            name: object.original_question_text, // This may seem backwards between name an natural but it looks better
            natural_question: object.id,
            notes: object.message, // We use the notes area to display the message
          };

          const answers = object.result_list;


          const nodesIdSet = new Set();
          const edgesIdSet = new Set();
          // Parse answerset specific graph here
          // For each answer find new nodes and edges that haven't already been added
          const nodes = [];
          const edges = [];
          answers.forEach((a) => {
            const g = a.result_graph;
            g.node_list.forEach((node) => {
              if (!nodesIdSet.has(node.id)) {
                nodesIdSet.add(node.id);
                nodes.push(node);
              }
            });
            g.edge_list.forEach((edge) => {
              const edgeId = `${edge.source_id} ${edge.target_id}`;
              if (!edgesIdSet.has(edgeId)) {
                edgesIdSet.add(edgeId);
                edges.push(edge);
              }
            });
          });
          // Package
          console.log(edges);
          const answersetGraph = { node_list: nodes, edge_list: edges };

          this.setState({
            question,
            answerset,
            answers,
            answersetGraph,
            isValid: true,
          });
        } catch (err) {
          window.alert('Failed to load this Answerset file. Are you sure this is valid?');
          console.log(err);
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file. The file may be invalid.');
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
      <AnswersetPres
        user={this.state.user}
        question={this.state.question}
        answerset={this.state.answerset}
        answers={this.state.answers}
        answersetGraph={this.state.answersetGraph}
      />
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
