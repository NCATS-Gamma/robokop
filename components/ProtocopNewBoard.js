'use babel';

import React from 'react';
import { ButtonToolbar, Button, ButtonGroup, Glyphicon, OverlayTrigger, Popover, FormControl } from 'react-bootstrap';
import ProtocopQueryEditor from './ProtocopQueryEditor';
import ProtocopQueryViewer from './ProtocopQueryViewer';
import CardTypes from './ProtocopQueryEditorCardTypes';
import NodeTypes from './ProtocopQueryEditorNodeTypes';

const shortid = require('shortid');

class ProtocopNewBoard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      description: '',
      query: [],
    };

    this.styles = {
      top: {
        paddingTop: '0px',
        paddingBottom: '20px',
      },
    };
    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangeDescription = this.handleChangeDescription.bind(this);
    this.handleChangeQuery = this.handleChangeQuery.bind(this);
    this.callbackCreate = this.callbackCreate.bind(this);
    this.queryTemplateSet = this.queryTemplateSet.bind(this);
  }

  handleChangeName(e) {
    this.setState({ name: e.target.value });
  }
  handleChangeDescription(e) {
    this.setState({ description: e.target.value });
  }
  handleChangeQuery(newQuery) {
    // Trim off the extra meta data in the query, dependent on node type
    const slimQuery = newQuery.map((e) => {
      let meta = {};
      const type = e.displayType;
      let label = e.nodeType;
      let isBoundType = false;
      let isBoundName = false;
      switch (e.type) {
        case CardTypes.NAMEDNODETYPE:
          isBoundType = true;
          isBoundName = true;
          label = e.name;
          meta = { name: e.name };
          break;
        case CardTypes.NODETYPE:
          isBoundType = true;
          label = e.nodeType;
          break;
        case CardTypes.NUMNODES:
          label = `?[${e.numNodesMin}...${e.numNodesMax}]`;
          // type = 'Unspecified';
          meta = { numNodesMin: e.numNodesMin, numNodesMax: e.numNodesMax };
          break;
        default:
      }
      return {
        id: e.id,
        nodeSpecType: e.type,
        type,
        label,
        isBoundName,
        isBoundType,
        meta,
      };
    });

    this.setState({ query: slimQuery });
  }
  queryTemplateSet(templateInd) {
    let newQuery = [];
    switch (templateInd) {
      case 0:
        newQuery = [];
        this.editorComponent.child.decoratedComponentInstance.setQuery(newQuery);
        this.setState({ name: '', description: '' });
        break;
      case 1:
        newQuery = [
          {
            id: shortid.generate(),
            type: CardTypes.NAMEDNODETYPE,
            name: 'Ebola Virus Disease',
            nodeType: NodeTypes.DISEASE.tag,
            displayType: NodeTypes.DISEASE.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nodeType: NodeTypes.GENE.tag,
            displayType: NodeTypes.GENE.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: '',
            nodeType: NodeTypes.GENETICCONDITION.tag,
            displayType: NodeTypes.GENETICCONDITION.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
        ];
        this.editorComponent.child.decoratedComponentInstance.setQuery(newQuery);
        this.setState({ name: 'Question 1: Ebola', description: 'Which other genetic conditions observed in the human population might offer protection from Ebola.' });
        break;
      case 2:
        newQuery = [
          {
            id: shortid.generate(),
            type: CardTypes.NAMEDNODETYPE,
            name: 'Imatinib',
            nodeType: NodeTypes.SUBSTANCE.tag,
            displayType: NodeTypes.SUBSTANCE.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: NodeTypes.GENE.name,
            nodeType: NodeTypes.GENE.tag,
            displayType: NodeTypes.GENE.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: NodeTypes.BIOLOGICALPROCESS.name,
            nodeType: NodeTypes.BIOLOGICALPROCESS.tag,
            displayType: NodeTypes.BIOLOGICALPROCESS.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: NodeTypes.CELL.name,
            nodeType: NodeTypes.CELL.tag,
            displayType: NodeTypes.CELL.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: NodeTypes.CELL.name,
            nodeType: NodeTypes.ANATOMY.tag,
            displayType: NodeTypes.ANATOMY.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NODETYPE,
            name: NodeTypes.PHENOTYPE.name,
            nodeType: NodeTypes.PHENOTYPE.tag,
            displayType: NodeTypes.PHENOTYPE.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
          {
            id: shortid.generate(),
            type: CardTypes.NAMEDNODETYPE,
            name: 'Asthma',
            nodeType: NodeTypes.DISEASE.tag,
            displayType: NodeTypes.DISEASE.tag,
            numNodesMin: 0,
            numNodesMax: 1,
          },
        ];
        this.editorComponent.child.decoratedComponentInstance.setQuery(newQuery);
        this.setState({ name: 'Question 2: IMATINIB to Asthma', description: 'The clinical outcome pathway of Imatinib for the treatment of Asthma.' });
      default:
        break;
    }
  }

  callbackCreate() {
    const newBoardInfo = {
      id: this.state.name.split(" ").join("_") + '_' + shortid.generate().replace('-','_');
      name: this.state.name,
      description: this.state.description,
      query: this.state.query,
    };
    this.props.callbackCreate(newBoardInfo);
  }

  render() {
    const infoHelp = (
      <Popover id="infoTooltip" key={shortid.generate()} title="Blackboard Information">
        <div style={{ textAlign: 'left' }}>
          <p>
            {'\
            Some general purpose information to help orgranize your blackboards.\
            '}
          </p>
          <ul>
            <li><bold>{'Name'}</bold>{': Just a name to refer to this blackboard.'}</li>
            <li><bold>{'Description'}</bold>{': A longer description of the goal of this blackboard.'}</li>
          </ul>
        </div>
      </Popover>
    );
    const queryBuilderHelp = (
      <Popover id="queryTooltip" key={shortid.generate()} title="Query Specification">
        <div style={{ textAlign: 'left' }}>
          <p>
            {'\
            Queries are specified as a sequence of steps that will be used to construct a knowledge graph.\
            Each step specifies the adjacent "node types" in resulting graph.\
            There are 3 different step types:\
            '}
          </p>
          <ul>
            <li><bold>{'Named Node'}</bold>{': Specify a particular type of node (Disease, Gene. etc.) with a specific name. '}</li>
            <li><bold>{'Node Type'}</bold>{': Specify a particular type of node (Disease, Gene. etc.).'}</li>
            <li><bold>{'Unspecified Nodes'}</bold>{': Can be a sequence between 0 and 5 nodes of any type.'}</li>
          </ul>
        </div>
      </Popover>
    );
    return (
      <div id="ProtocopNewBoard" className="col-md-12">
        <div className="row">
          <div className="col-md-10 col-md-offset-1" style={this.styles.top}>
            <h2>{'Start a New Blackboard'}</h2>
            <p>
              {'In PROTOCOP, blackboards are created using the interface below. In a future version of ROBOCOP, natural language will be accepted.'}
              <br />
              {'To get started quickly, try one of these templates:'}
            </p>
            <div style={{ paddingLeft: '5px' }}>
              <ButtonToolbar>
                <ButtonGroup>
                  <Button bsSize="small" onClick={() => this.queryTemplateSet(1)}>
                    {'Question 1 Example'}
                  </Button>
                  <Button bsSize="small" onClick={() => this.queryTemplateSet(2)}>
                    {'Question 2 Example'}
                  </Button>
                </ButtonGroup>
              </ButtonToolbar>
            </div>
          </div>
        </div>
        <div className="row" style={{ paddingBottom: '10px' }}>
          <div className="col-md-10 col-md-offset-1">
            <div className="row">
              <div className="col-md-12">
                <h5>
                  <bold style={{ fontWeight: '600' }}>Blackboard Information:</bold>
                  <OverlayTrigger placement="right" overlay={infoHelp}>
                    <span> {'    '} <Glyphicon glyph="question-sign" /> </span>
                  </OverlayTrigger>
                </h5>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <FormControl
                  type="text"
                  value={this.state.name}
                  placeholder="Blackboard name:"
                  onChange={this.handleChangeName}
                />
              </div>
            </div>
            <div className="row" style={{ paddingTop: '5px' }}>
              <div className="col-md-6">
                <FormControl
                  type="textarea"
                  value={this.state.description}
                  placeholder="Blackboard description:"
                  onChange={this.handleChangeDescription}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-5 col-md-offset-1">
            <div className="row">
              <div className="col-md-12">
                <h5>
                  <bold style={{ fontWeight: '600' }}>Query Specification:</bold>
                  <OverlayTrigger placement="right" overlay={queryBuilderHelp}>
                    <span> {'    '} <Glyphicon glyph="question-sign" /> </span>
                  </OverlayTrigger>
                </h5>
              </div>
            </div>
            <ProtocopQueryEditor
              ref={(r) => { this.editorComponent = r; }}
              handleChange={this.handleChangeQuery}
            />
          </div>
          <div className="col-md-5 col-md-offset-1">
            <div className="row">
              <div className="col-md-12">
                <h5 style={{ textAlign: 'center' }}><bold style={{ fontWeight: '600' }}>Query Visualization</bold></h5>
              </div>
            </div>
            <ProtocopQueryViewer
              query={this.state.query}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-5 col-md-offset-1" style={{ marginTop: '20px' }}>
            <ButtonToolbar>
              <Button bsStyle="default" bsSize="lg" onClick={this.callbackCreate}>
                Create
              </Button>
              <Button bsStyle="default" bsSize="lg" onClick={this.props.callbackCancel}>
                Cancel
              </Button>
            </ButtonToolbar>
          </div>
        </div>
      </div>
    );
  }
}

export default ProtocopNewBoard;
