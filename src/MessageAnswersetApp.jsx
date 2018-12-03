import React from 'react';

import { Grid, Row, Col, Button } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import FaCloudUpload from 'react-icons/lib/fa/cloud-upload';


import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import MessageAnswersetPres from './components/answerset/MessageAnswersetPres';

const shortid = require('shortid');
const _ = require('lodash');

class AnswersetApp extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      conceptsReady: false,
      isValid: false,
      isReading: false,
      user: {},
      message: {},
      concepts: [],
    };
  }

  componentDidMount() {
    // makes the appropriate GET request from server.py,
    // uses the result to set this.state
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
    this.appConfig.concepts((data) => {
      this.setState({
        concepts: data,
        conceptsReady: true,
      });
    });
  }

  onDrop(acceptedFiles, rejectedFiles) {
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => this.setState({ isReading: true });
      fr.onloadend = () => this.setState({ isReading: false });
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const object = JSON.parse(fileContents);
          const message = _.cloneDeep(object);
          message.creator = object.tool_version;
          message.datetime = object.datetime;

          // const question = { // These are the required fields for our question header
          //   name: object.original_question_text, // This may seem backwards between name an natural but it looks better
          //   natural_question: object.id,
          //   notes: object.message, // We use the notes area to display the message
          // };

          const { answers } = message;
          // assign score = -1 if missing
          answers.forEach((a) => {
            if (!a.score) {
              a.score = -1;
            }
          });

          // answers.forEach((a) => {
          //   a.result_graph.edge_list.forEach((edge) => {
          //     if (!('id' in edge)) {
          //       edge.id = `${edge.provided_by}(${edge.source_id}-(${edge.type})->${edge.target_id})`;
          //     }
          //   });
          // });

          // answers.forEach((a, i) => {
          //   const answerNodeIds = new Set();
          //   a.result_graph.node_list.forEach((n) => {
          //     if (answerNodeIds.has(n.id)) {
          //       console.log(`Answer ${i + 1} has multiple nodes with id ${n.id}. Future errors will result.`);
          //     } else {
          //       answerNodeIds.add(n.id);
          //     }
          //   });
          // });

          // const nodesIdSet = new Set();
          // const edgesIdSet = new Set();
          // // Parse answerset specific graph here
          // // For each answer find new nodes and edges that haven't already been added
          // const nodes = [];
          // const edges = [];
          // answers.forEach((a) => {
          //   const g = a.result_graph;
          //   g.node_list.forEach((node) => {
          //     if (!nodesIdSet.has(node.id)) {
          //       nodesIdSet.add(node.id);
          //       nodes.push(node);
          //     }
          //   });
          //   g.edge_list.forEach((edge) => {
          //     const edgeId = edge.id;
          //     if (!edgesIdSet.has(edgeId)) {
          //       edgesIdSet.add(edgeId);
          //       edges.push(edge);
          //     }
          //   });
          // });
          // // Package
          // const answersetGraph = { node_list: nodes, edge_list: edges };

          this.setState({
            message,
            isValid: true,
          });
        } catch (err) {
          console.log(err);
          window.alert('Failed to load this Answerset file. Are you sure this is valid?');
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
      <Row>
        <Col md={12}>
          <h1>
            Robokop Answer Set Explorer (Uses new Message spec)
            <br />
            <small>
              {'Use the Robokop Answerset UI with answer files create from other sources.'}
            </small>
          </h1>
          <Dropzone
            onDrop={(acceptedFiles, rejectedFiles) => this.onDrop(acceptedFiles, rejectedFiles) }
            multiple={false}
            style={{
              width: '100%',
              height: '400px',
              backgroundColor: this.appConfig.colors.bluegray,
              textAlign: 'center',
              display: 'table',
              border: '1px solid transparent',
              borderColor: '#e7e7e7',
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
              <h1 style={{ fontSize: '48px' }}>
                <FaCloudUpload />
              </h1>
              <h3>
                Drag and drop your answer set file, or click to browse.
              </h3>
            </div>
          </Dropzone>
        </Col>
      </Row>
    );
  }
  renderBodyReading() {
    return (
      <Row>
        <Col md={12}>
          <h1>
            Loading Answers...
            <br />
            <small>
              Please Wait.
            </small>
          </h1>
          <Loading />
        </Col>
      </Row>
    );
  }

  renderBodyValid() {
    return (
      <MessageAnswersetPres
        user={this.state.user}
        concepts={this.state.concepts}
        message={this.state.message}
      />
    );
  }
  renderLoaded() {
    const { isValid, isReading } = this.state;
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          {!isValid && !isReading && this.renderBodyUpload()}
          {!isValid && isReading && this.renderBodyReading()}
          {isValid && this.renderBodyValid()}
        </Grid>
        <Footer config={this.props.config} />
      </div>
    );
  }
  render() {
    const ready = this.state.userReady && this.state.conceptsReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default AnswersetApp;
