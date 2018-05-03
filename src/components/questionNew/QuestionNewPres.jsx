import React from 'react';
import { Grid, Row, Col, ButtonToolbar, Button, ButtonGroup, OverlayTrigger, Popover, FormControl } from 'react-bootstrap';
import GoQuestion from 'react-icons/go/question';

import QuestionLinearEditor from './QuestionLinearEditor';
import QuestionLinearGraph from './QuestionLinearGraph';
import CardTypes from './QuestionNewCardTypes';

const _ = require('lodash');
const shortid = require('shortid');

class QuestionNewPres extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.templateSet = this.templateSet.bind(this);
  }

  componentDidMount() {
    this.initialize(this.props);
  }

  initialize(props) {
    // On initialization we might have an inititialization question
    // At this point we need to set the query to match the previous question
    // Because the question spec between the UI and engine is different
    // We must do some interpretation
    // Also we throw away some stuff before sending it to the server
    // so this is a bit hacky and potentially error prone.

    if (('initializationQuestion' in props) && !_.isEmpty(props.initializationQuestion)) {
      // Use the ref to the editor component to actualy set this query.

      const newQuery = props.initializationQuestion.nodes.map((n) => {
        let nameId = '';
        if ('identifiers' in n && Array.isArray(n.identifiers) && n.identifiers.length > 0) {
          nameId = n.identifiers[0];
        }
        let nameEntry = {};
        let nameIsValid = false;
        if (n.nodeSpecType === CardTypes.NAMEDNODETYPE) {
          nameEntry = { label: n.label, value: nameId };
          nameIsValid = true;
        }

        return {
          id: shortid.generate(),
          type: n.nodeSpecType,
          name: n.label,
          nameId,
          nameEntry,
          nameIsValid,
          nodeType: n.type,
          displayType: n.type,
          numNodesMin: 0,
          numNodesMax: 1,
        };
      });

      this.editorComponent.child.decoratedComponentInstance.setQuery(newQuery);
    }
  }

  templateSet(templateInd) {
    let newQuery = [];
    switch (templateInd) {
      case 0:
        newQuery = [];
        this.editorComponent.child.decoratedComponentInstance.setQuery(newQuery);
        this.props.handleChangeName({ target: { value: '' } });
        this.props.handleChangeNatural({ target: { value: '' } });
        this.props.handleChangeNotes({ target: { value: '' } });
        // this.setState({ name: '', description: '' });
        break;
      case 1:
        newQuery = [
          {
            id: shortid.generate(),
            type: CardTypes.NAMEDNODETYPE,
            name: 'Ebola hemorrhagic fever',
            nameId: 'MONDO:0005737',
            nameEntry: { label: 'Ebola hemorrhagic fever', value: 'MONDO:0005737' },
            nameIsValid: true,
            nodeType: 'disease',
            displayType: 'disease',
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nameId: '',
            nameEntry: {},
            nameIsValid: false,
            nodeType: 'gene',
            displayType: 'gene',
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nameId: '',
            nameEntry: {},
            nameIsValid: false,
            nodeType: 'genetic_condition',
            displayType: 'genetic_condition',
            numNodesMin: 0,
            numNodesMax: 1,
          },
        ];
        this.editorComponent.child.decoratedComponentInstance.setQuery(newQuery);
        this.props.handleChangeName({ target: { value: 'Ebola Genetic Conditions' } });
        this.props.handleChangeNatural({ target: { value: 'Which other genetic conditions observed in the human population might offer protection from Ebola?' } });
        this.props.handleChangeNotes({ target: { value: '#Ebola #Q1' } });

        break;
      case 2:
        newQuery = [
          {
            id: shortid.generate(),
            type: CardTypes.NAMEDNODETYPE,
            name: 'Imatinib',
            nameId: '',
            nameEntry: {},
            nameIsValid: false,
            nodeType: 'chemical_substance',
            displayType: 'chemical_substance',
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nameId: '',
            nameEntry: {},
            nameIsValid: false,
            nodeType: 'gene',
            displayType: 'gene',
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nameId: '',
            nameEntry: {},
            nameIsValid: false,
            nodeType: 'biological_process',
            displayType: 'biological_process',
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nameId: '',
            nameEntry: {},
            nameIsValid: false,
            nodeType: 'cell',
            displayType: 'cell',
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nameId: '',
            nameEntry: {},
            nameIsValid: false,
            nodeType: 'anatomical_entity',
            displayType: 'anatomical_entity',
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nameId: '',
            nameEntry: {},
            nameIsValid: false,
            nodeType: 'phenotypic_feature',
            displayType: 'phenotypic_feature',
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NAMEDNODETYPE,
            name: 'asthma',
            nameId: 'MONDO:0004979',
            nameEntry: { label: 'asthma', value: 'MONDO:0004979' },
            nameIsValid: true,
            nodeType: 'disease',
            displayType: 'disease',
            numNodesMin: 0,
            numNodesMax: 1,
          },
        ];
        this.editorComponent.child.decoratedComponentInstance.setQuery(newQuery);
        this.props.handleChangeName({ target: { value: 'IMATINIB to Asthma Clinical Outcome Pathway' } });
        this.props.handleChangeNatural({ target: { value: 'What is the clinical outcome pathway of Imatinib for the treatment of Asthma?' } });
        this.props.handleChangeNotes({ target: { value: '#Imatinib #Asthma #COP #Q2' } });
        break;
      default:
        break;
    }
  }

  render() {
    const infoHelp = (
      <Popover id="infoTooltip" key={shortid.generate()} title="Question Information" style={{ minWidth: '500px' }}>
        <div style={{ textAlign: 'left' }}>
          <p>
            Some general purpose information to help orgranize your questions.
          </p>
          <ul>
            <li><bold>Name</bold>{': Just a name to refer to this question.'}</li>
            <li><bold>Natural Language Question</bold>{': State your question in plane text.'}</li>
            <li><bold>Notes</bold>{': Any text to communicate to other user or help you find this later. Hashtags etc..'}</li>
          </ul>
        </div>
      </Popover>
    );
    const queryBuilderHelp = (
      <Popover id="queryTooltip" key={shortid.generate()} title="Questions Specification" style={{ minWidth: '500px' }}>
        <div style={{ textAlign: 'left' }}>
          <p>
            Questions are specified as a sequence of steps that will be used to construct a knowledge graph.
            Each step specifies the adjacent <b>concept types</b> in a knowledge graph.
            There are 3 different types of concept declaration:
          </p>
          <ul>
            <li><bold>Named Node</bold>{': Specify a particular type of node (Disease, Gene. etc.) with a specific name. '}</li>
            <li><bold>Node Type</bold>{': Specify a particular type of node (Disease, Gene. etc.).'}</li>
            <li><bold>Unspecified Nodes</bold>{': Can be a sequence between 0 and 5 nodes of any type.'}</li>
          </ul>
        </div>
      </Popover>
    );

    const isValid = true;
    return (
      <Grid>
        <Row>
          <Col md={12}>
            {!this.props.isFork &&
              <div>
                <h2>Start a New Question</h2>
                <p>
                  Questions are created using the interface below.
                  <br />
                  To get started quickly, try one of these templates:
                </p>
                <div style={{ paddingLeft: '5px' }}>
                  <ButtonToolbar>
                    <ButtonGroup>
                      <Button bsSize="small" onClick={() => this.templateSet(1)}>
                        {'Question 1 Example'}
                      </Button>
                      <Button bsSize="small" onClick={() => this.templateSet(2)}>
                        {'Question 2 Example'}
                      </Button>
                    </ButtonGroup>
                  </ButtonToolbar>
                </div>
              </div>
            }
            {this.props.isFork &&
              <div>
                <h2>Fork Question</h2>
                <p>
                  Questions are owned by users and can be deleted. If you like a question you can make yourself a copy that you own. We call this "forking".
                  <br />
                  Before we create your copy of this question, you are free to make any edits.
                  <br />
                  Keep in mind however that any edits will result in a different question
                  and different question will require us to collect new answers.
                </p>
              </div>
            }
          </Col>
        </Row>
        <Row style={{ paddingBottom: '10px', paddingTop: '10px' }}>
          <Col md={6}>
            <h5>
              <bold style={{ fontWeight: '600' }}>Question Information:</bold>
              <OverlayTrigger placement="right" overlay={infoHelp}>
                <span> {'    '} <GoQuestion /> </span>
              </OverlayTrigger>
            </h5>
            <div>
              <FormControl
                type="text"
                value={this.props.name}
                placeholder="Name"
                onChange={this.props.handleChangeName}
              />
            </div>
            <div style={{ paddingTop: '5px' }}>
              <FormControl
                type="textarea"
                value={this.props.natural}
                placeholder="Natural language question"
                onChange={this.props.handleChangeNatural}
              />
            </div>
            <div style={{ paddingTop: '5px' }}>
              <FormControl
                type="textarea"
                value={this.props.notes}
                placeholder="Notes"
                onChange={this.props.handleChangeNotes}
              />
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <h5>
              <bold style={{ fontWeight: '600' }}>Question Specification:</bold>
              <OverlayTrigger placement="right" overlay={queryBuilderHelp}>
                <span> {'    '} <GoQuestion /> </span>
              </OverlayTrigger>
            </h5>
            <QuestionLinearEditor
              ref={(r) => { this.editorComponent = r; }}
              handleChange={this.props.handleChangeMachineQuestion}
              concepts={this.props.concepts}
              callbackSearch={this.props.callbackSearch}
            />
          </Col>
          <Col md={6}>
            <h5 style={{ textAlign: 'center' }}><bold style={{ fontWeight: '600' }}>Query Visualization</bold></h5>
            <QuestionLinearGraph
              machineQuestion={this.props.machineQuestion}
            />
          </Col>
        </Row>
        <Row>
          <Col md={6} style={{ marginTop: '20px' }}>
            <ButtonToolbar>
              <Button bsStyle="default" bsSize="lg" onClick={this.props.callbackCreate}>
                Create
              </Button>
              <Button bsStyle="default" bsSize="lg" onClick={this.props.callbackCancel}>
                Cancel
              </Button>
            </ButtonToolbar>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default QuestionNewPres;
