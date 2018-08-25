import React from 'react';
import Dialog from 'react-bootstrap-dialog';

import { Grid, Row, Col, Popover, OverlayTrigger } from 'react-bootstrap';
import GoQuestion from 'react-icons/go/question';

import AppConfig from './AppConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import QuestionDesign from './components/shared/QuestionDesign';

const shortid = require('shortid');

class QuestionNew extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      userReady: false,
      dataReady: false,
      conceptsReady: false,
      user: {},
      question: '',
      machineQuestion: null,
    };

    this.onCreate = this.onCreate.bind(this);
  }

  componentDidMount() {
    this.appConfig.concepts((data) => {
      this.setState({
        concepts: data,
        conceptsReady: true,
      });
    });

    this.appConfig.user((data) => {
      this.setState({
        user: data,
        userReady: true,
      });
    });
    const isFork = this.props.initializationId !== '';
    if (isFork) {
      this.appConfig.questionData(
        this.props.initializationId,
        data => this.setState({
          question: data.question.natural_question,
          machineQuestion: data.question.machine_question,
          dataReady: true,
        }),
      );
    } else {
      this.setState({
        question: null,
        machineQuestion: null,
        dataReady: true,
      });
    }
  }

  onCreate({ questionText, machineQuestion }) {
    const newBoardInfo = {
      natural_question: questionText,
      notes: '',
      machine_question: machineQuestion,
    };

    // Splash wait overlay
    this.dialogWait({
      title: 'Creating Question...',
      text: '',
      showLoading: true,
    });

    this.appConfig.questionCreate(
      newBoardInfo,
      data => this.appConfig.redirect(this.appConfig.urls.question(data)), // Success redirect to the new question page
      (err) => {
        this.dialogMessage({
          title: 'Trouble Creating Question',
          text: `We ran in to problems creating this question. This could be due to an intermittent network error. If you encounter this error repeatedly, please contact the system administrators. ${err.response.data.message}`,
          buttonText: 'OK',
          buttonAction: () => {},
        });
      },
    );
  }

  dialogWait(inputOptions) {
    const defaultOptions = {
      title: 'Hi',
      text: 'Please wait...',
      showLoading: false,
    };
    const options = { ...defaultOptions, ...inputOptions };

    const bodyNode = (
      <div>
        {options.text}
        {options.showLoading &&
          <Loading />
        }
      </div>
    );

    // Show custom react-bootstrap-dialog
    this.dialog.show({
      title: options.title,
      body: bodyNode,
      actions: [],
      bsSize: 'large',
      onHide: () => {},
    });
  }

  dialogMessage(inputOptions) {
    const defaultOptions = {
      title: 'Hi',
      text: 'How are you?',
      buttonText: 'OK',
      buttonAction: () => {},
    };
    const options = { ...defaultOptions, ...inputOptions };

    // Show custom react-bootstrap-dialog
    this.dialog.show({
      title: options.title,
      body: options.text,
      actions: [
        Dialog.Action(
          options.buttonText,
          (dialog) => { dialog.hide(); options.buttonAction(); },
          'btn-primary',
        ),
      ],
      bsSize: 'large',
      onHide: (dialog) => {
        dialog.hide();
      },
    });
  }

  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    const questionHelp = (
      <Popover id="queryTooltip" key={shortid.generate()} title="Question Help" style={{ minWidth: '500px' }}>
        <div style={{ textAlign: 'left' }}>
          <p>
            Questions are asked in plain English with some domain specific parsing. We can link together a variety of biomedical concepts using several predicts.
          </p>
        </div>
      </Popover>
    );

    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          <Row>
            <Col md={12}>
              <div style={{ paddingLeft: 15, paddingRight: 15 }}>
                <h1>Start a New Question</h1>
                <p>
                  Type your question in the box below. To get started quickly, explore the examples by clicking on the arrow on the right. 
                  <OverlayTrigger placement="right" overlay={questionHelp}>
                    <span> {'    '} <GoQuestion /> </span>
                  </OverlayTrigger>
                </p>
              </div>
              <QuestionDesign
                height={750}
                initializationData={{ question: this.state.question, machineQuestion: this.state.machineQuestion }}
                concepts={this.state.concepts}
                nextText="Create"
                nextCallback={this.onCreate}
                nlpParse={this.appConfig.questionNewTranslate}
              />
            </Col>
          </Row>
        </Grid>
        <Footer config={this.props.config} />
        <Dialog ref={(el) => { this.dialog = el; }} />
      </div>
    );
  }
  render() {
    const ready = this.state.conceptsReady && this.state.dataReady && this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default QuestionNew;
