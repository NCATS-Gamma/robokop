import React from 'react';
import { Modal, DropdownButton, MenuItem } from 'react-bootstrap';

import CurieSelectorContainter from '../CurieSelectorContainer';
import AppConfig from '../../../AppConfig';
import { config } from '../../../index';

const shortid = require('shortid');
const _ = require('lodash');

class QuestionTemplateModal extends React.Component {
  constructor(props) {
    super(props);

    this.appConfig = new AppConfig(config);

    this.state = {
      questionTemplate: {},
      questionName: [],
      disableSubmit: true,
      nameList: [],
      types: [],
      labels: [],
      curies: [],
    };

    this.selectQuestion = this.selectQuestion.bind(this);
    this.replaceName = this.replaceName.bind(this);
    this.submitTemplate = this.submitTemplate.bind(this);
    this.handleCurieChange = this.handleCurieChange.bind(this);
    this.handleCurieSearch = this.handleCurieSearch.bind(this);
    this.extractDetails = this.extractDetails.bind(this);
  }

  selectQuestion(event) {
    const questionTemplate = _.cloneDeep(event);
    let questionName = questionTemplate.natural_question;
    questionName = this.replaceName(questionName);
    const { types, labels, curies } = this.extractDetails(questionTemplate);
    this.setState({
      questionTemplate, questionName, types, labels, curies,
    });
  }

  replaceName(qName) {
    const nameList = [];
    let question = qName;
    question = question.split(/\s|\?/g);
    let num = 0;
    for (let i = 0; i < question.length; i += 1) {
      if (question[i].match(/\$name\d\$/)) {
        question[i] = question[i].replace(/\$name\d\$/, '_______');
        question[i + 1] = question[i + 1].replace(/\$identifier\d\$/, '_____________');
        nameList.push({
          nameIndex: i, idIndex: i + 1, name: '', id: '', ider: num,
        });
        num += 1;
      }
    }
    this.setState({ nameList });
    return question;
  }

  extractDetails(questionTemplate) {
    const types = [];
    const labels = [];
    const curies = [];
    questionTemplate.machine_question.nodes.forEach((node) => {
      if (node.curie) {
        types.push(node.type);
        labels.push('');
        curies.push('');
      }
    });
    return { types, labels, curies };
  }

  handleCurieChange(index, type, label, curie) {
    const {
      questionName, nameList, curies, labels,
    } = this.state;
    nameList.forEach((name) => {
      if (name.ider === index && label && curie) {
        questionName[name.nameIndex] = label;
        name.name = label;
        labels[index] = label;
        questionName[name.idIndex] = '(' + curie + ')'; // eslint-disable-line
        name.id = curie;
        curies[index] = curie;
        this.setState({
          questionName, nameList, labels, curies,
        }, () => {
          if (questionName.indexOf('____') === -1) {
            this.updateQuestionTemplate();
          }
        });
      } else if (name.ider === index && !label && !curie) {
        // we delete whatever was there before. Disable the submit button.
        questionName[name.nameIndex] = '_______';
        questionName[name.idIndex] = '(_____________)';
        labels[name.ider] = '';
        curies[name.ider] = '';
        this.setState({
          questionName, labels, curies, disableSubmit: true,
        });
      }
    });
  }

  updateQuestionTemplate() {
    const { nameList, questionTemplate, questionName } = this.state;
    questionTemplate.natural_question = questionName.join(' ');
    let num = 0;
    questionTemplate.machine_question.nodes.forEach((node) => {
      if (node.curie) {
        if (Array.isArray(node.curie)) {
          node.curie.forEach((curie, i) => {
            // TODO: num only works if there's only one curie in the array. So far, that's the only case.
            node.curie[i] = nameList[num].id;
            node.name = nameList[num].name;
            num += 1;
          });
        } else {
          node.curie = nameList[0].id;
          node.name = nameList[0].name;
        }
      }
    });
    this.setState({ questionTemplate, disableSubmit: false });
  }

  handleCurieSearch(input, type) {
    return this.appConfig.questionNewSearch(input, type);
  }

  submitTemplate() {
    this.props.toggleModal();
    this.props.selectQuestion(this.state.questionTemplate);
  }

  render() {
    const {
      showModal, toggleModal, questions, concepts,
    } = this.props;
    const {
      disableSubmit, nameList, curies, labels, types, questionName,
    } = this.state;
    return (
      <Modal
        show={showModal}
        onHide={toggleModal}
        backdrop
      >
        <Modal.Header closeButton>
          <Modal.Title>Question Templates</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DropdownButton
            bsStyle="default"
            title="Load a question template"
            key={1}
            id="dropdown-question-template"
          >
            {questions.map(question => (
              <MenuItem
                key={shortid.generate()}
                eventKey={question}
                onSelect={this.selectQuestion}
              >
                {question.natural_question}
              </MenuItem>))
            }
          </DropdownButton>
          <input
            value={questionName.join(' ')}
            disabled
            placeholder="Please select a question template to get started."
            style={{
              display: 'block', width: '100%', margin: '20px 0px', height: '45px', fontSize: '20px',
            }}
          />
          {nameList.map((name, i) => (
            <CurieSelectorContainter
              key={shortid.generate()}
              concepts={concepts}
              onChangeHook={(ty, te, cu) => this.handleCurieChange(i, ty, te, cu)}
              initialInputs={{ curie: curies[i], term: labels[i], type: types[i] }}
              disableType
              search={this.handleCurieSearch}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <button id="questionTempButton" onClick={this.submitTemplate} disabled={disableSubmit}>Load Question</button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default QuestionTemplateModal;
