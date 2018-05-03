import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Button, Form, FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap';
import { DragSource, DropTarget } from 'react-dnd'

import MdCancel from 'react-icons/md/cancel'

import CardTypes from './QuestionNewCardTypes';
import getNodeTypeColorMap from './ColorUtils';

import Select from 'react-select';

const _ = require('lodash');
const shortid = require('shortid');

const styles = {
  cardBar: {
    height: '41px',
    border: '0px',
    borderBottom: '1px',
    borderColor: '#a1a1a1',
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px',
    borderStyle: 'solid',
    margin: '0px',
    backgroundColor: 'gray',
    cursor: 'move',
  },
  cardContent: {
    padding: '5px 10px',
    // minHeight: '50px',
  },
  cardParent: {//cursor: 'move',
    backgroundColor: 'white',
    boxShadow: '0px 0px 6px #3c3c3c',
    // border: '1px solid #a0a0a0',
    borderTopRightRadius: '5px',
    borderTopLeftRadius: '5px',
    borderBottomRightRadius: '5px',
    borderBottomLeftRadius: '5px',
    marginBottom: '8px',
  },
  button: {
    height: '36px',
  }
  
}

const cardSource = {
	beginDrag(props) {
		return {
			id: props.id,
			originalIndex: props.findCard(props.id).index,
		}
	},

	endDrag(props, monitor) {
		const { id: droppedId, originalIndex } = monitor.getItem()
		const didDrop = monitor.didDrop()

		if (!didDrop) {
			props.moveCard(droppedId, originalIndex)
		}
	},
}

const cardTarget = {
	canDrop() {
		return false
	},

	hover(props, monitor) {
		const { id: draggedId } = monitor.getItem()
		const { id: overId } = props

		if (draggedId !== overId) {
			const { index: overIndex } = props.findCard(overId)
			props.moveCard(draggedId, overIndex)
		}
	},
}

@DropTarget('card', cardTarget, connect => ({
	connectDropTarget: connect.dropTarget(),
}))
@DragSource('card', cardSource, (connect, monitor) => ({
	connectDragSource: connect.dragSource(),
	isDragging: monitor.isDragging(),
}))
class QuestionLinearEditorCard extends Component {
	// static propTypes = {
	// 	connectDragSource: PropTypes.func.isRequired,
	// 	connectDropTarget: PropTypes.func.isRequired,
	// 	isDragging: PropTypes.bool.isRequired,
	// 	id: PropTypes.any.isRequired,
	// 	text: PropTypes.string.isRequired,
	// 	moveCard: PropTypes.func.isRequired,
	// 	findCard: PropTypes.func.isRequired,
  // }
  
  constructor(props) {
    super(props)

    this.handleChangeType = this.handleChangeType.bind(this);
    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangeNodeType = this.handleChangeNodeType.bind(this);
    this.handleChangeMaxNodes = this.handleChangeMaxNodes.bind(this);
    this.handleChangeMinNodes = this.handleChangeMinNodes.bind(this);

    // Store colormap from nodeType to color for titlebar coloring of cards
    this.nodeTypeColorMap = getNodeTypeColorMap(this.props.concepts);

  }

  getCard() {
    // This object specification must match, what we expect in ProtoCopQueryEditor
    return {
      id: this.props.id,
      type: this.props.type,
      name: this.props.name,
      nameId: this.props.nameId,
      nameEntry: this.props.nameEntry,
      nodeType: this.props.nodeType,
      displayType: this.props.displayType,
      numNodesMin: this.props.numNodesMin,
      numNodesMax: this.props.numNodesMax,
    };
  }
  handleChangeType(newType) {
    const card = this.getCard();
    card.type = newType.value;
    card.displayType = card.type === CardTypes.NUMNODES ? 'Unspecified' : card.nodeType;
    this.props.callbackUpdateCard(card); 
  }
  handleChangeName(entry) {
    const card = this.getCard();
    // card.name = e.value;
    if (entry) {
      card.name = entry.label;
      card.nameId = entry.value;
      card.nameEntry = entry;
      card.nameIsValid = true;
    } else {
      card.name = '';
      card.nameId = ''
      card.nameEntry = {};
      card.nameIsValid = false;
    }
    
    this.props.callbackUpdateCard(card);
  }
  handleChangeNodeType(newNodeType) {
    const card = this.getCard();
    card.nodeType = newNodeType.value;
    card.displayType = newNodeType.value;
    this.props.callbackUpdateCard(card);
  }
  handleChangeMaxNodes(newVal) {
    const card = this.getCard();
    card.numNodesMax = newVal.value;
    this.props.callbackUpdateCard(card);
  }
  handleChangeMinNodes(newVal) {
    const card = this.getCard();
    card.numNodesMin = newVal.value;
    this.props.callbackUpdateCard(card);
  }

  getSearchOptions (input,nodeType) {
    if (!input || (input.length < 3)) {
      return Promise.resolve({ options: [] });
    }

    return this.props.callbackSearch(input, nodeType);
  }
  

  render() {
    const {
      id,
      text,
      isDragging,
      connectDragSource,
      connectDropTarget,
      type,
      name,
      nameId,
      nameEntry,
      nameIsValid,
      nodeType,
      displayType,
      numNodesMin,
      numNodesMax,
    } = this.props
    const opacity = isDragging ? 0 : 1

    const isValid = (type === CardTypes.NAMEDNODETYPE) ? nameIsValid : true;
    // const validityBorder = isValid ? {} : {border: 'solid 2px red'};
    // const validityBorder = isValid ? {} : {boxShadow: '0px 0px 3px red'};
    const validityBorder = isValid ? {} : {borderRight: 'solid 5px red'};

    let contentFragment = [];

    // Setup background color for titlebar
    const undefinedColor = '#aaa';
    let backgroundColor = {backgroundColor: this.nodeTypeColorMap(displayType)};

    let nodeTypeKeys = this.props.concepts; 
    const nodeTypeOptions = nodeTypeKeys.map((k) => {
      return {value: k, label: k};
    });
    
    switch (type) {
        case CardTypes.NAMEDNODETYPE:

          contentFragment = [            
            <div className="row" key={shortid.generate()}>
              <div className="col-md-2">
                <h5>Type:</h5>
              </div>
              <div className="col-md-4">
                <Select
                  name="NodeTypeSelect"
                  value={nodeType}
                  options={nodeTypeOptions}
                  onChange={this.handleChangeNodeType}
                  clearable={false}
                />
              </div>
              <div className="col-md-6">
                <Select.Async
                  multi={false}
                  value={nameEntry}
                  valueRenderer={opt => (<div>{opt.label}<span className="pull-right" style={{ paddingRight: '15px' }}> {opt.value} </span></div>)}
                  optionRenderer={opt => (<div>{opt.label}<span className="pull-right"> {opt.value} </span></div>)}
                  onChange={this.handleChangeName}
                  valueKey="value"
                  labelKey="label"
                  loadOptions={(input) => this.getSearchOptions(input, nodeType)}
                  backspaceRemoves={true}
                />
              </div>
            </div>
          ];
          break;
        case CardTypes.NODETYPE:
          contentFragment = [            
            <div className="row" key={shortid.generate()}>
              <div className="col-md-2">
                <h5>Type:</h5>
              </div>
              <div className="col-md-4">
                <Select
                  name="NodeTypeSelect"
                  value={nodeType}
                  options={nodeTypeOptions}
                  onChange={this.handleChangeNodeType}
                  clearable={false}
                />
              </div>
            </div>
          ];
          break;
        case CardTypes.NUMNODES:
          // backgroundColor = {backgroundColor: 'yellow'};

          let minOptions = [];
          for (let i = 0; i <= Math.max(0, numNodesMax); i += 1){
            minOptions.push({value: i, label: i.toString()});
          }
          let maxOptions = [];
          for (let i = numNodesMin; i <= 5; i += 1){
            maxOptions.push({value: i, label: i.toString()});
          }

          contentFragment = [
            <div className="row" key={shortid.generate()}>
              <div className="col-md-3">
                <h5>Min # Nodes:</h5>
              </div>
              <div className="col-md-3">
                <Select
                  name="MinNodesSelect"
                  value={numNodesMin}
                  options={minOptions}
                  onChange={this.handleChangeMinNodes}
                  clearable={false}
                />
              </div>
              <div className="col-md-3">
                <h5>Max # Nodes:</h5>
              </div>
              <div className="col-md-3">
                <Select
                  name="MaxNodesSelect"
                  value={numNodesMax}
                  options={maxOptions}
                  onChange={this.handleChangeMaxNodes}
                  clearable={false}
                />
              </div>
            </div>
          ];
          break;
        default:
          contentFragment = [<p>Invalid Node Data</p>]
    }

    const disableDelete = this.props.numCards < 2;
    
    let typeOptionKeys = Object.keys(CardTypes); 
    const typeOptions = typeOptionKeys.map((k) => {
      return {value: CardTypes[k], label: CardTypes[k]};
    });
    
    return connectDragSource(
			connectDropTarget(
        <div style={{ ...styles.cardParent, opacity, ...validityBorder }}>
          <div className="row" style={{...styles.cardBar, ...backgroundColor}}>
            <div className="col-md-4" style={{marginLeft: '-15px'}}>
              <Select
                name="NodeSpecType"
                value={type}
                options={typeOptions}
                onChange={this.handleChangeType}
                clearable={false}
                style={{marginLeft: '2px', marginTop: '2px'}}
              />
            </div>
            <div className="close-button pull-right">
              {!disableDelete && <MdCancel onClick={() => this.props.callbackDeleteCard(id)} />}
            </div>
          </div>
          <div className="row" style={styles.cardContent}>
            <div className="col-md-12" style={{...styles.cardContent}}>
              {contentFragment}
            </div>
          </div>
        </div>
      ),
		);
	}
}

export default QuestionLinearEditorCard;