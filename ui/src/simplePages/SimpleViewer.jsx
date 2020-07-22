import React from 'react';

import { Grid, Row, Col } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import { FaCloudUploadAlt } from 'react-icons/fa';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import MessageAnswersetPres from './components/answerset/MessageAnswersetPres';
import AnswersetStore from './stores/messageAnswersetStore';
import useMessageStore from './stores/useMessageStore';

const _ = require('lodash');

class SimpleViewer extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);
    this.answersetStore = null;

    this.state = {
      userReady: false,
      conceptsReady: false,
      hasMessage: false,
      isReading: true,
      user: {},
      concepts: [],
      hasError: false,
      errorMessage: '',
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
        (err) => {
          console.log(err);
          this.setState({
            isReading: false,
            hasError: true,
            hasMessage: false,
            errorMessage: 'There was a problem fetching the stored file from the server. This may be an invalid identifier.',
          });
        },
      );
    } else {
      this.setState({
        isReading: false,
        hasError: false,
        hasMessage: false,
        errorMessage: '',
      });
    }
  }
  parseMessage(message) {
    const hasMessage = _.isObject(message);
    if (hasMessage && 'query_graph' in message) {
      message['question_graph'] = message['query_graph'];
      delete message['query_graph'];
    }
    let hasQGraph = hasMessage && 'question_graph' in message;
    let hasKG = hasMessage && 'knowledge_graph' in message;
    if (hasMessage && 'results' in message) {
      message['answers'] = message['results'];
      delete message['results'];
    }
    let hasAnswers = hasMessage && 'answers' in message && Array.isArray(message.answers) && message.answers.length > 0;

    let allOk = hasQGraph && hasKG && hasAnswers;

    if (allOk) {
      this.answersetStore = useMessageStore(message);
      this.setState({
        hasMessage: true,
        hasError: false,
        errorMessage: '',
        isReading: false,
      });
      return;
    }

    hasQGraph = hasMessage && 'query_graph' in message;
    hasKG = hasMessage && 'knowledge_graph' in message;
    hasAnswers = hasMessage && 'results' in message && Array.isArray(message.results) && message.results.length > 0;
    allOk = hasQGraph && hasKG && hasAnswers;

    if (allOk) {
      message.results.map((result) => {
        const nodeBindings = {};
        result.node_bindings.forEach((nb) => {
          if (nb.qg_id in nodeBindings) {
            if (Array.isArray(nb.kg_id)) {
              nodeBindings[nb.qg_id].concat(nb.kg_id);
            } else {
              nodeBindings[nb.qg_id].append(nb.kg_id);
            }
          } else if (Array.isArray(nb.kg_id)) {
            nodeBindings[nb.qg_id] = nb.kg_id;
          } else {
            nodeBindings[nb.qg_id] = [nb.kg_id];
          }
        });
        result.node_bindings = nodeBindings;
        const edgeBindings = {};
        result.edge_bindings.forEach((eb) => {
          if (eb.qg_id in edgeBindings) {
            if (Array.isArray(eb.kg_id)) {
              edgeBindings[eb.qg_id].concat(eb.kg_id);
            } else {
              edgeBindings[eb.qg_id].push(eb.kg_id);
            }
          } else if (Array.isArray(eb.kg_id)) {
            edgeBindings[eb.qg_id] = eb.kg_id;
          } else {
            edgeBindings[eb.qg_id] = [eb.kg_id];
          }
        });
        result.edge_bindings = edgeBindings;
        return result;
      });
      message.question_graph = message.query_graph;
      message.answers = message.results;

      this.answersetStore = useMessageStore(message);

      this.setState({
        hasMessage: true,
        hasError: false,
        errorMessage: '',
        isReading: false,
      });
      return;
    }

    let errorMessage = '';
    if (!hasMessage) {
      errorMessage = `${errorMessage} The uploaded file does not appear to be a valid JSON object.`;
    }
    if (!hasQGraph) {
      errorMessage = `${errorMessage} A question_graph must be provided.`;
    }
    if (!hasKG) {
      errorMessage = `${errorMessage} A knowledge_graph must be provided.`;
    }
    if (!hasAnswers) {
      errorMessage = `${errorMessage} An answers array must be provided.`;
    }
    this.setState({
      hasMessage: false,
      hasError: true,
      isReading: false,
      errorMessage,
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
          this.setState({ hasError: true, errorMessage: 'There was the problem loading the file. Is this valid JSON?' });
        }
      };
      fr.onerror = () => {
        // window.alert('Sorry but there was a problem uploading the file. The file may be invalid.');
        this.setState({ hasError: true, errorMessage: 'There was the problem loading the file. Is this valid JSON?' });
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
              marginBottom: '20px',
              cursor: 'pointer',
            }}
          >
            {({getRootProps, getInputProps}) => (
              <section>
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
                    <h1 style={{ fontSize: '48px' }}>
                      <FaCloudUploadAlt />
                    </h1>
                    <h3>
                      Drag and drop an answerset file, or click to browse.
                    </h3>
                  </div>
                </div>
              </section>
            )}
            
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

  renderBodyError() {
    return (
      <Row>
        <Col md={12}>
          <h1>
            There was a problem loading the file.
            <br />
          </h1>
          <p>
            {this.state.errorMessage}
          </p>
        </Col>
      </Row>
    );
  }

  renderBodyValid() {
    return (
      <MessageAnswersetPres
        user={this.state.user}
        concepts={this.state.concepts}
        store={this.answersetStore}
        omitHeader
      />
    );
  }
  renderLoaded() {
    const { hasMessage, isReading, hasError } = this.state;
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          {!hasMessage && !isReading && !hasError && this.renderBodyUpload()}
          {!hasMessage && isReading && !hasError && this.renderBodyReading()}
          {!hasMessage && !isReading && hasError && this.renderBodyError()}
          {hasMessage && !isReading && !hasError && this.renderBodyValid()}
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
