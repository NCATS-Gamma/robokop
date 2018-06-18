import React from 'react';
import ReactJson from 'react-json-view';

import { Row, Col, ButtonToolbar, Button } from 'react-bootstrap';

import MachineQuestionView from './MachineQuestionView';

class MachineQuestionViewAndEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showJson: false,
    };

    this.toggleView = this.toggleView.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onAdd = this.onAdd.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  onEdit(edit) {
    console.log(edit);
    // this.props.onUpdate()
  }
  onAdd(add) {
    console.log(add);
    // this.props.onUpdate()
  }
  onDelete(del) {
    console.log(del);
    // this.props.onUpdate()
  }
  toggleView() {
    this.setState({ showJson: !this.state.showJson });
  }

  render() {
    const { showJson } = this.state;
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          {!showJson &&
            <MachineQuestionView
              question={this.props.question}
            />
          }
          {showJson &&
            <ReactJson
              src={this.props.question}
              onEdit={this.onEdit}
              onAdd={this.onAdd}
              onDelete={this.onDelete}
            />
          }
        </div>
        <div style={{ width: '50px', height: '50px', position: 'absolute', top: 0, right: '-50px', backgroundColor: 'red' }}>
          <Button
            bsStyle="link"
            onClick={this.toggleView}
          >
            {'<<>>'}
          </Button>
        </div>
      </div>
    );
  }
}

MachineQuestionViewAndEdit.defaultProps = {
  question: {
    nodes: [],
    edges: [],
  },
  onUpdate: (newQuestion) => {},
};

export default MachineQuestionViewAndEdit;

