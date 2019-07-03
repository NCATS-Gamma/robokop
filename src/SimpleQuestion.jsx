import React from 'react';
import { inject, observer } from 'mobx-react';
import { toJS } from 'mobx';
import _ from 'lodash';
import { Grid, Row, Col, Panel, Form, FormGroup, FormControl, Tabs, Tab } from 'react-bootstrap';
import FaDownload from 'react-icons/lib/fa/download';

import AppConfig from './AppConfig';
import AnswersetStore from './stores/messageAnswersetStore';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import questionTemplates from '../queries/index';
import HelpButton from './components/shared/HelpButton';
import NewQuestionButtons from './components/shared/NewQuestionButtons';
import MachineQuestionViewContainer, { graphStates } from './components/shared/MachineQuestionViewContainer';
import QuestionTemplateModal from './components/shared/modals/QuestionTemplate';
import MessageAnswersetTable from './components/answerset/MessageAnswersetTable';
import AnswersetGraph from './components/answerset/AnswersetGraph';
import SimpleQuestionGraph from './components/shared/graphs/SimpleQuestionGraph';


@inject(({ store }) => ({ store }))
@observer
class SimpleQuestion extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    // this store will get initialized once we have answers
    this.answersetStore = null;

    this.state = {
      ready: false,
      user: {},
      message: {},
      loading: false,
      loaded: false,
      tabKey: 1,
      showQuestionTemplateModal: false,
    };

    this.onResetQuestion = this.onResetQuestion.bind(this);
    this.onDownloadQuestion = this.onDownloadQuestion.bind(this);
    this.onDownloadAnswer = this.onDownloadAnswer.bind(this);
    this.onDropFile = this.onDropFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.onQuestionTemplate = this.onQuestionTemplate.bind(this);
    this.toggleQuestionTemplate = this.toggleQuestionTemplate.bind(this);
  }

  componentDidMount() {
    this.props.store.getQuestionData('');
    this.appConfig.user(
      data => this.setState({
        user: data,
        ready: true,
      }),
      (err) => {
        console.log('Failed to retrieve user information. This may indicate a connection issue.');
        console.log(err);
      },
    );
  }

  onDownloadQuestion() {
    const data = this.props.store.getMachineQuestionSpecJson;
    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'robokopMachineQuestion.json';
    a.href = url;
    a.click();
    a.remove();
  }

  onDownloadAnswer() {
    const data = this.state.message;

    // Transform the data into a json blob and give it a url
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a link with that URL and click it.
    const a = document.createElement('a');
    a.download = 'answerset.json';
    a.href = url;
    a.click();
    a.remove();
  }

  onDropFile(acceptedFiles) {
    acceptedFiles.forEach((file) => {
      const fr = new window.FileReader();
      fr.onloadstart = () => this.props.store.setGraphState(graphStates.fetching);
      fr.onload = (e) => {
        const fileContents = e.target.result;
        try {
          const fileContentObj = JSON.parse(fileContents);
          this.props.store.machineQuestionSpecToPanelState(fileContentObj);
        } catch (err) {
          console.error(err);
          window.alert('Failed to read this Question template. Are you sure this is valid?');
          this.props.store.setGraphState(graphStates.error);
        }
      };
      fr.onerror = () => {
        window.alert('Sorry but there was a problem uploading the file. The file may be invalid JSON.');
        this.props.store.resetQuestion();
        this.props.store.setGraphState(graphStates.error);
      };
      fr.readAsText(file);
    });
  }

  onResetQuestion() {
    if (window.confirm('Are you sure you want to reset this question? This action cannot be undone.')) {
      this.props.store.resetQuestion();
    }
  }

  onSubmit() {
    const questionText = this.props.store.questionName;
    const machineQuestion = this.props.store.getMachineQuestionSpecJson.machine_question;
    const maxConnect = this.props.store.max_connectivity;
    const newBoardInfo = {
      natural_question: questionText,
      notes: '',
      machine_question: machineQuestion,
      max_connectivity: maxConnect,
    };
    this.setState({ loading: true, loaded: false });
    this.appConfig.simpleQuick(
      newBoardInfo,
      (data) => {
        this.answersetStore = new AnswersetStore(data);
        this.setState({ message: data, loading: false, loaded: true });
      },
      (err) => {
        console.log('Trouble asking question:', err);
        this.setState({ loading: false });
      },
    );
  }

  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }

  toggleQuestionTemplate() {
    this.setState(prevState => ({ showQuestionTemplateModal: !prevState.showQuestionTemplateModal }));
  }

  // Loads the question template and updates the MobX store/UI
  onQuestionTemplate(question) {
    this.props.store.machineQuestionSpecToPanelState(question);
  }

  render() {
    const {
      user, ready, loading, loaded, showQuestionTemplateModal, tabKey,
    } = this.state;
    const { config } = this.props;
    const questionList = _.cloneDeep(questionTemplates);
    return (
      <div>
        {ready ?
          <div>
            <Header config={config} user={user} />
            <Grid>
              <Row>
                {!loading && !loaded &&
                  <div>
                    <Col md={12}>
                      <NewQuestionButtons
                        onDownloadQuestion={this.onDownloadQuestion}
                        onDropFile={this.onDropFile}
                        onResetQuestion={this.onResetQuestion}
                        onSubmitQuestion={this.onSubmit}
                        toggleModal={this.toggleQuestionTemplate}
                        graphValidationState={this.props.store.graphValidationState}
                      />
                    </Col>
                    <Col md={12}>
                      <h3 style={{ display: 'inline-block' }}>
                        {'Question '}
                        <HelpButton link="questionNew" />
                      </h3>
                      <Form horizontal onSubmit={e => e.preventDefault()}>
                        <FormGroup
                          bsSize="large"
                          controlId="formHorizontalNodeIdName"
                          validationState={this.props.store.questionName.length > 0 ? 'success' : 'error'}
                          style={{ margin: '0' }}
                        >
                          <FormControl
                            type="text"
                            value={this.props.store.questionName}
                            onChange={e => this.props.store.updateQuestionName(e.target.value)}
                          />
                        </FormGroup>
                      </Form>
                    </Col>
                    <Col md={12}>
                      <Panel>
                        <Panel.Heading>
                          <Panel.Title>
                            {'Machine Question Editor - Question Graph '}
                            <HelpButton link="machineQuestionEditor" />
                          </Panel.Title>
                        </Panel.Heading>
                        <Panel.Body style={{ padding: '0px' }}>
                          <MachineQuestionViewContainer
                            height="350px"
                            width={this.props.width}
                          />
                        </Panel.Body>
                      </Panel>
                    </Col>
                  </div>
                }
                {loaded &&
                  <div>
                    <div style={{ position: 'block', paddingBottom: '10px' }}>
                      <h1 style={{ display: 'inline' }}>{this.props.store.questionName}</h1>
                      <span style={{ fontSize: '22px', float: 'right', marginTop: '10px' }} title="Download">
                        <FaDownload style={{ cursor: 'pointer' }} onClick={this.onDownloadAnswer} />
                      </span>
                    </div>
                    <SimpleQuestionGraph
                      store={this.answersetStore}
                      concepts={toJS(this.props.store.concepts)}
                    />
                    <Tabs
                      activeKey={tabKey}
                      onSelect={this.handleTabSelect}
                      animation
                      id="answerset_tabs"
                      mountOnEnter
                    >
                      <Tab
                        eventKey={1}
                        title="Answers Table"
                      >
                        <MessageAnswersetTable
                          concepts={toJS(this.props.store.concepts)}
                          store={this.answersetStore}
                        />
                      </Tab>
                      <Tab
                        eventKey={2}
                        title="Aggregate Graph"
                      >
                        <AnswersetGraph
                          concepts={toJS(this.props.store.concepts)}
                          store={this.answersetStore}
                        />
                      </Tab>
                    </Tabs>
                  </div>
                }
                {loading &&
                  <Loading
                    message={<p style={{ textAlign: 'center' }}>Loading Answerset</p>}
                  />
                }
              </Row>
            </Grid>
            <Footer config={config} />
            <QuestionTemplateModal
              showModal={showQuestionTemplateModal}
              toggleModal={this.toggleQuestionTemplate}
              questions={questionList}
              selectQuestion={this.onQuestionTemplate}
              concepts={toJS(this.props.store.concepts)}
            />
          </div>
        :
          <Loading />
        }
      </div>
    );
  }
}

export default SimpleQuestion;
