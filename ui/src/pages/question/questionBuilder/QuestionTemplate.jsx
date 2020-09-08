import React, { useState, useRef } from 'react';
import {
  Modal, DropdownButton, MenuItem, Button,
} from 'react-bootstrap';
import shortid from 'shortid';
import _ from 'lodash';

import CurieSelectorContainer from '../../../components/shared/curies/CurieSelectorContainer';
import config from '../../../config.json';

function extractDetails(questionTemplate) {
  const newTypes = [];
  const newLabels = [];
  const newCuries = [];
  questionTemplate.machine_question.nodes.forEach((node) => {
    if (node.curie) {
      // we're going to grab the number of the identifier from the curie and add that node's type to the list of types in its correct spot.
      if (Array.isArray(node.curie)) {
        node.curie.forEach((curie) => {
          // find the indentifier's number
          const i = curie.match(/\d/);
          // minus one because index starts at 0
          newTypes[i - 1] = node.type;
        });
      } else {
        const i = node.curie.match(/\d/);
        newTypes[i - 1] = node.type;
      }
      newLabels.push('');
      newCuries.push('');
    }
  });
  return { newTypes, newLabels, newCuries };
}

function displayQuestion(questionName) {
  if (questionName.length > 0) {
    // here we just add a space in between each word.
    for (let i = 0; i < questionName.length; i += 2) {
      questionName.splice(i, 0, ' ');
    }
  }
  return questionName;
}

export default function QuestionTemplateModal(props) {
  const {
    selectQuestion, showModal, questions, concepts, close,
  } = props;
  const [questionTemplate, setQuestionTemplate] = useState({});
  const [questionName, updateQuestionName] = useState([]);
  const [disableSubmit, setDisableSubmit] = useState(true);
  const [nameList, updateNameList] = useState([]);
  const [types, setTypes] = useState([]);
  const [labels, setLabels] = useState([]);
  const [curies, setCuries] = useState([]);
  const curieSelector = useRef({});

  function setFocus(num) {
    curieSelector.current[`curie${num}`].curieSelector.input.focus();
  }

  function replaceName(qName, newTypes) {
    const newNameList = [];
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
            type="button"
            style={{
              textDecoration: 'underline', color: 'grey', border: 'none', backgroundColor: 'white',
            }}
            onClick={() => setFocus(refNum)}
            key={shortid.generate()}
          >
            {newTypes[refNum]}
          </button>
        );
        newNameList.push({
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
    updateNameList(newNameList);
    return question;
  }

  function selectNewQuestionTemplate(event) {
    const newQuestionTemplate = _.cloneDeep(event);
    let newQuestionName = newQuestionTemplate.natural_question;
    const { newTypes, newLabels, newCuries } = extractDetails(newQuestionTemplate);
    newQuestionName = replaceName(newQuestionName, newTypes);
    setQuestionTemplate(newQuestionTemplate);
    updateQuestionName(newQuestionName);
    setTypes(newTypes);
    setCuries(newCuries);
    setLabels(newLabels);
  }

  function updateQuestionTemplate() {
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
    setQuestionTemplate({ ...questionTemplate });
    setDisableSubmit(false);
  }

  function handleCurieChange(index, type, label, curie) {
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
          const update = nameList.every((nameObj) => nameObj.name && nameObj.id);
          if (update) {
            updateQuestionTemplate();
          }
        });
      } else if (name.ider === index && !label && !curie) {
        // we delete whatever was there before. Disable the submit button.
        questionName[name.nameIndex] = (
          <button
            type="button"
            style={{
              textDecoration: 'underline', color: 'grey', border: 'none', backgroundColor: 'white',
            }}
            onClick={() => setFocus(name.ider)}
            key={shortid.generate()}
          >
            {types[name.ider]}
          </button>
        );
        labels[name.ider] = '';
        curies[name.ider] = '';
        setDisableSubmit(true);
      }
      updateQuestionName([...questionName]);
      updateNameList([...nameList]);
      setLabels([...labels]);
      setCuries([...curies]);
    });
  }

  function handleCurieSearch(input, type) {
    return this.appConfig.questionNewSearch(input, type);
  }

  function submitTemplate() {
    selectQuestion(questionTemplate);
    setQuestionTemplate({});
    updateQuestionName([]);
    setDisableSubmit(true);
    updateNameList([]);
    setTypes([]);
    setLabels([]);
    setCuries([]);
  }

  return (
    <Modal
      show={showModal}
      backdrop
      onHide={close}
    >
      <Modal.Header closeButton>
        <Modal.Title>Question Templates</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ minHeight: 200 }}>
        <div className="questionTemplateDropdown" id={questionName.length > 0 ? '' : 'centeredQuestionTemplateMenu'}>
          <DropdownButton
            bsStyle="default"
            title={questionName.length > 0 ? 'Change templates' : 'Select a question template'}
            key={1}
            id="questionTemplateDropdown"
          >
            {questions.map((question) => (
              <MenuItem
                key={shortid.generate()}
                eventKey={question}
                onSelect={selectNewQuestionTemplate}
              >
                {question.natural_question}
              </MenuItem>
            ))}
          </DropdownButton>
        </div>
        {questionName.length > 0 && (
          <div>
            <h4
              style={{
                display: 'block', width: '100%', margin: '20px 0px', height: '45px', fontSize: '20px', textAlign: 'center', cursor: 'default',
              }}
            >
              {displayQuestion(_.cloneDeep(questionName))}
            </h4>
            <p>Choose curies below to fill out the template.</p>
          </div>
        )}
        {nameList.map((name, i) => (
          <CurieSelectorContainer
            key={['curieSelector', i].join('_')}
            ref={(type) => { curieSelector.current[`curie${i}`] = type; }}
            concepts={concepts}
            onChangeHook={(ty, te, cu) => handleCurieChange(i, ty, te, cu)}
            initialInputs={{ curie: curies[i], term: labels[i], type: types[i] }}
            disableType
            search={handleCurieSearch}
          />
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button id="questionTempButton" onClick={submitTemplate} disabled={disableSubmit}>Load Question</Button>
      </Modal.Footer>
    </Modal>
  );
}
