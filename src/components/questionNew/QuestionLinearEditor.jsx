import React from 'react';

import PropTypes from 'prop-types'
import update from 'immutability-helper'
import { DropTarget, DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Button } from 'react-bootstrap';
import FaPlus from 'react-icons/fa/plus';

import QuestionLinearEditorCard from './QuestionLinearEditorCard';
import CardTypes from './QuestionNewCardTypes';
import NodeTypes from './QuestionNewNodeTypes';

const shortid = require('shortid');

const cardTarget = {
	drop() {},
}

@DragDropContext(HTML5Backend)
@DropTarget('card', cardTarget, connect => ({
	connectDropTarget: connect.dropTarget(),
}))
class QuestionLinearEditor extends React.Component {

	constructor(props) {
		super(props)
    
    this.firstCard = {
      id: shortid.generate(),
      type: CardTypes.NAMEDNODETYPE,
      name: '',
      nameId: '',
      nameEntry: {},
      nameIsValid: false,
      nodeType: NodeTypes.DISEASE.tag,
      displayType: NodeTypes.DISEASE.tag,
      numNodesMin: 0,
      numNodesMax: 5,
    }

    this.defaultCard = {
      id: '', // Generate one when we need to
      type: CardTypes.NODETYPE,
      name: '',
      nameId: '',
      nameEntry: {},
      nameIsValid: false,
      nodeType: NodeTypes.DISEASE.tag,
      displayType: NodeTypes.DISEASE.tag,
      numNodesMin: 0,
      numNodesMax: 1,
    }

    this.state = {
      cards: [ this.firstCard ]
    };
    
    // this.handleChangeQuery = this.handleChangeQuery.bind(this);
    this.newCard = this.newCard.bind(this);
    this.moveCard = this.moveCard.bind(this);
    this.findCard = this.findCard.bind(this);
    this.updateCard = this.updateCard.bind(this);
    this.deleteCard = this.deleteCard.bind(this);
	}
  newCard(){
    const newCard = Object.assign({}, this.defaultCard);
    newCard.id = shortid.generate();
    
    const cards = this.state.cards;
    cards.push(newCard);

    this.setState({ cards }, () => {this.props.handleChange(cards); this.domNode.scrollIntoView(false);}); // Force page to scroll to bottom of element
  }
  moveCard(id, atIndex) {
    const {card, index} = this.findCard(id);
    const cards = update(this.state.cards, {$splice: [[index, 1], [atIndex, 0, card]]});
    this.setState({ cards }, () => this.props.handleChange(cards));
	}

  updateCard(card) {
    const index = this.findCardIndex(card.id);
    const cards = this.state.cards;
    cards[index] = card;
    
    this.setState({ cards }, () => this.props.handleChange(cards));
  }
  deleteCard(id) {
    const index = this.findCardIndex(id);
    const cards = update(this.state.cards, {$splice: [[index, 1]]});
    
    this.setState({ cards }, () => this.props.handleChange(cards));
  }

	findCardIndex(id) {
    return this.state.cards.findIndex(c => c.id === id);
  }
  
  findCard(id) {
		const { cards } = this.state
		const card = cards.filter(c => c.id === id)[0]

		return {
			card,
			index: cards.indexOf(card),
		}
	}

  componentDidMount(){
    // Communicate back the initialized list of cards
    this.props.handleChange(this.state.cards);
  }

  setQuery(cards) {
    this.setState({ cards });
    this.props.handleChange(cards);
  }
  
	render() {
		const { connectDropTarget } = this.props
		const { cards } = this.state

		return connectDropTarget(
      <div id="ProtocopQueryEditor" ref={(domNode) => { this.domNode = domNode; }}>
        <div className="row">
          <div className="col-md-12">
            {cards.map(card => (
              <QuestionLinearEditorCard
                key={card.id}
                id={card.id}
                type={card.type}
                name={card.name}
                nameId={card.nameId}
                nameEntry={card.nameEntry}
                nameIsValid={card.nameIsValid}
                nodeType={card.nodeType}
                displayType={card.displayType}
                numNodesMin={card.numNodesMin}
                numNodesMax={card.numNodesMax}
                moveCard={this.moveCard}
                findCard={this.findCard}
                numCards={this.state.cards.length}
                callbackUpdateCard={this.updateCard}
                callbackDeleteCard={this.deleteCard}
                callbackSearch={this.props.callbackSearch}
              />
            ))}
          </div>
        </div>
        <div className="row">
          <div className="col-md-1 col-md-offset-5" style={{padding: '10px 0'}}>
            <Button bsStyle="default" bsSize="sm" onClick={this.newCard}>
              <FaPlus />
            </Button>
          </div>
        </div>
			</div>,
		)
  }
}

export default QuestionLinearEditor;
