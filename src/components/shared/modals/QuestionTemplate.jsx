import React from 'react';
import { Modal, DropdownButton, MenuItem, Button } from 'react-bootstrap';

import CurieSelectorContainer from '../curies/CurieSelectorContainer';
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
    this.setFocus = this.setFocus.bind(this);
    this.displayQuestion = this.displayQuestion.bind(this);
  }

  selectQuestion(event) {
    const questionTemplate = _.cloneDeep(event);
    let questionName = questionTemplate.natural_question;
    const { types, labels, curies } = this.extractDetails(questionTemplate);
    questionName = this.replaceName(questionName, types);
    this.setState({
      questionTemplate, questionName, types, labels, curies,
    });
  }

  replaceName(qName, types) {
    const nameList = [];
    let question = qName;
    question = question.split(/\s|\?/g);
    let num = 1;
    for (let i = 0; i < question.length; i += 1) {
      const nameRegex = `$name${num}$`;
      const idRegex = `($identifier${num}$)`;
      if (question[i] === nameRegex) {
        // onClick=this[curie${num - 1}].refs.curieSelector.refs.input.focus()
        const refNum = num - 1;
        question[i] = (
          <button
            style={{
              textDecoration: 'underline', color: 'grey', border: 'none', backgroundColor: 'white',
            }}
            onClick={() => this.setFocus(refNum)}
            key={shortid.generate()}
          >
            {types[refNum]}
          </button>
        );
        nameList.push({
          nameIndex: i, name: '', id: '', ider: refNum,
        });
        for (let j = i; j < question.length; j += 1) {
          if (question[j] === idRegex) {
            question.splice(j, 1);
          }
        }
        num += 1;
      }
    }
    this.setState({ nameList });
    return question;
  }

  setFocus(num) {
    this[`curie${num}`].curieSelector.input.focus();
  }

  extractDetails(questionTemplate) {
    const types = [];
    const labels = [];
    const curies = [];
    questionTemplate.machine_question.nodes.forEach((node) => {
      if (node.curie) {
        // we're going to grab the number of the identifier from the curie and add that node's type to the list of types in its correct spot.
        if (Array.isArray(node.curie)) {
          node.curie.forEach((curie) => {
            // find the indentifier's number
            const i = curie.match(/\d/);
            // minus one because index starts at 0
            types[i - 1] = node.type;
          });
        } else {
          const i = node.curie.match(/\d/);
          types[i - 1] = node.type;
        }
        labels.push('');
        curies.push('');
      }
    });
    return { types, labels, curies };
  }

  displayQuestion(questionName) {
    if (questionName.length > 0) {
      // here we just add a space in between each word.
      for (let i = 0; i < questionName.length; i += 2) {
        questionName.splice(i, 0, ' ');
      }
    } else {
      return 'Please select a question template to get started.';
    }
    return questionName;
  }

  handleCurieChange(index, type, label, curie) {
    const {
      questionName, nameList, curies, labels, types,
    } = this.state;
    nameList.forEach((name, i) => {
      if (name.ider === index && label && curie) {
        questionName[name.nameIndex] = `${label} (${curie})`;
        nameList[i].name = label;
        nameList[i].id = curie;
        labels[index] = label;
        curies[index] = curie;
        this.setState({
          questionName, nameList, labels, curies,
        }, () => {
          // check to see if all entries in nameList have a label and curie and update question template if they do.
          const update = nameList.every(nameObj => nameObj.name && nameObj.id);
          if (update) {
            this.updateQuestionTemplate();
          }
        });
      } else if (name.ider === index && !label && !curie) {
        // we delete whatever was there before. Disable the submit button.
        questionName[name.nameIndex] = (
          <button
            style={{
              textDecoration: 'underline', color: 'grey', border: 'none', backgroundColor: 'white',
            }}
            onClick={() => this.setFocus(name.ider)}
            key={shortid.generate()}
          >
            {types[name.ider]}
          </button>
        );
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
    questionTemplate.machine_question.nodes.forEach((node, index) => {
      if (node.curie) {
        if (Array.isArray(node.curie)) {
          node.curie.forEach((curie, i) => {
            // TODO: num only works if there's only one curie in the array. So far, that's the only case.
            questionTemplate.machine_question.nodes[index].curie[i] = nameList[num].id;
            questionTemplate.machine_question.nodes[index].name = nameList[num].name;
            num += 1;
          });
        } else {
          questionTemplate.machine_question.nodes[index].curie = nameList[0].id;
          questionTemplate.machine_question.nodes[index].name = nameList[0].name;
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
    this.setState({
      questionTemplate: {},
      questionName: [],
      disableSubmit: true,
      nameList: [],
      types: [],
      labels: [],
      curies: [],
    });
  }

  render() {
    const {
      showModal, toggleModal, questions, concepts,
    } = this.props;
    const {
      disableSubmit, nameList, curies, labels, types, questionName,
    } = this.state;
    const questionDisplay = this.displayQuestion(_.cloneDeep(questionName));
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
            title={questionName.length > 0 ? 'Change templates' : 'Select a question template'}
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
          <h4
            style={{
              display: 'block', width: '100%', margin: '20px 0px', height: '45px', fontSize: '20px', textAlign: 'center', cursor: 'default',
            }}
          >
            { questionDisplay }
          </h4>
          {questionName.length > 0 &&
            <p>Choose curies below to fill out the template.</p>
          }
          {nameList.map((name, i) => (
            <CurieSelectorContainer
              key={['curieSelector', i].join('_')}
              ref={(type) => { this[`curie${i}`] = type; }}
              concepts={concepts}
              onChangeHook={(ty, te, cu) => this.handleCurieChange(i, ty, te, cu)}
              initialInputs={{ curie: curies[i], term: labels[i], type: types[i] }}
              disableType
              search={this.handleCurieSearch}
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button id="questionTempButton" onClick={this.submitTemplate} disabled={disableSubmit}>Load Question</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default QuestionTemplateModal;
