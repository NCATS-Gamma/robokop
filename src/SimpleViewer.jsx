import React from 'react';

import { Grid, Row, Col, Alert } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import FaCloudUpload from 'react-icons/lib/fa/cloud-upload';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import MessageAnswersetPres from './components/answerset/MessageAnswersetPres';

const _ = require('lodash');

class SimpleViewer extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      conceptsReady: false,
      hasMessage: false,
      isReading: false,
      user: {},
      message: {},
      concepts: [],
      hadError: false,
    };

    this.parseMessage = this.parseMessage.bind(this);
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

    if (this.props.id) {
      // request the file
      this.appConfig.viewData(
        this.props.id,
        (object) => {
          this.parseMessage(object); // This will set state
        },
        () => {
          this.setState({ hadError: true });
        },
      );
    }
  }
  parseMessage(object) {
    const message = _.cloneDeep(object);
    const allOk = _.isObject(message) &&
      'question_graph' in message &&
      'knowledge_graph' in message &&
      'answers' in message;

    // Probably do some more checks here

    if (allOk) {
      this.setState({
        message,
        hasMessage: true,
        hadError: false,
      });
      return;
    }
    this.setState({
      message: {},
      hasMessage: false,
      hadError: true,
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
          this.parseMessage(object);
        } catch (err) {
          console.log(err);
          // window.alert('Failed to load this Answerset file. Are you sure this is valid?');
          this.setState({ hadError: true });
        }
      };
      fr.onerror = () => {
        // window.alert('Sorry but there was a problem uploading the file. The file may be invalid.');
        this.setState({ hadError: true });
      };
      fr.readAsText(file);
    });
  }

  renderLoading() {
    return (
      <p />
    );
  }
  renderBodyUpload() {
    return (
      <Row>
        <Col md={12}>
          {this.state.hadError &&
            <Alert bsStyle="danger">
              An error was encountered loading the requested file.
            </Alert>
          }
          <h1>
            Answer Set Explorer
            <br />
            <small>
              {'Explore answers and visualize knowledge graphs.'}
            </small>
          </h1>
          <Dropzone
            onDrop={(acceptedFiles, rejectedFiles) => this.onDrop(acceptedFiles, rejectedFiles)}
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
                Drag and drop an answerset file, or click to browse.
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
        omitHeader
      />
    );
  }
  renderLoaded() {
    const { hasMessage, isReading } = this.state;
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          {!hasMessage && !isReading && this.renderBodyUpload()}
          {!hasMessage && isReading && this.renderBodyReading()}
          {hasMessage && this.renderBodyValid()}
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

export default SimpleViewer;
