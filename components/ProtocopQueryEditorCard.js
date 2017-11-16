import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Glyphicon } from 'react-bootstrap';
import { DragSource, DropTarget } from 'react-dnd'
import CardTypes from './ProtocopQueryEditorCardTypes';
import NodeTypes from './ProtocopQueryEditorNodeTypes';

import {Creatable} from 'react-select';

const _ = require('lodash');
const shortid = require('shortid');
var Select = require('react-select');

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
class ProtocopQueryEditorCard extends Component {
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
    this.nodeTypeColorMap = {};
    Object.keys(NodeTypes).forEach(k => (this.nodeTypeColorMap[NodeTypes[k].tag] = NodeTypes[k].color));
  }

  getCard() {
    // This object specification must match, what we expect in ProtoCopQueryEditor
    return {
      id: this.props.id,
      type: this.props.type,
      name: this.props.name,
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
  handleChangeName(e) {
    const card = this.getCard();
    // card.name = e.value;
    card.name = e.target.value;
    // console.log('New name: ', e.target.value)
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
  // shouldComponentUpdate(nextProps, nextState) {
  //   if ( this.props.id === nextProps.id && 
  //     this.props.type === nextProps.type && 
  //     this.props.nodeType === nextProps.nodeType &&
  //     this.props.displayType === nextProps.displayType &&
  //     this.props.numNodesMin === nextProps.numNodesMin &&
  //     this.props.numNodesMax === nextProps.numNodesMax &&
  //     !(this.props.name === nextProps.name)) {
  //     return false;
  //   }
  //   return true;
  // }

	render() {
		const {
      id,
			text,
			isDragging,
			connectDragSource,
      connectDropTarget,
      type,
      name,
      nodeType,
      displayType,
      numNodesMin,
      numNodesMax,
		} = this.props
		const opacity = isDragging ? 0 : 1

    let contentFragment = [];

    // Setup background color for titlebar
    const undefinedColor = '#aaa';
    let backgroundColor = {backgroundColor: (this.nodeTypeColorMap[displayType] ? this.nodeTypeColorMap[displayType] : undefinedColor)};

    let nodeTypeKeys = Object.keys(NodeTypes); 
    const nodeTypeOptions = nodeTypeKeys.map((k) => {
      return {value: NodeTypes[k].tag, label: NodeTypes[k].name};
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
                {<FormControl autoFocus
                  inputRef={ref => { this.nameInput = ref; }}
                  type="textarea"
                  value={name}
                  placeholder={"Enter a name"}
                  onChange={this.handleChangeName}
                  onFocus={(e) => { // Fix to make autofocus put cursor at end of text-field
                    var val = e.target.value;
                    e.target.value = '';
                    e.target.value = val;
                  }}
                />
                }
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
        <div style={{ ...styles.cardParent, opacity }}>
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
              {!disableDelete && <Glyphicon glyph="remove" onClick={() => this.props.callbackDeleteCard(id)} />}
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

export default ProtocopQueryEditorCard;