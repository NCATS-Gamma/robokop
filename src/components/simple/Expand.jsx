import React from 'react';

import { FormGroup, FormControl, InputGroup, DropdownButton, MenuItem, Glyphicon } from 'react-bootstrap';

import { AutoSizer } from 'react-virtualized';
import Bionames from '../shared/Bionames';

import entityNameDisplay from '../util/entityNameDisplay';
import { findIndex } from 'rxjs/operator/findIndex';

class Expand extends React.Component {
  constructor(props) {
    super(props);

    this.onTermSelect = this.onTermSelect.bind(this);
    this.onTermUnSelect = this.onTermUnSelect.bind(this);
    this.onTypeChange = this.onTypeChange.bind(this);

    this.updateTypeConcepts = this.updateTypeConcepts.bind(this);

    this.state = {
      hasTerm: false,
      term: null,
      type: 'disease',
      typeConcepts: [],
    };

  }

  componentDidMount() {
    this.updateTypeConcepts(this.props.concepts);
  }
  componentWillReceiveProps(newProps) {
    this.updateTypeConcepts(newProps.concepts);
  }

  onTermSelect(value) {
    this.setState({ hasTerm: true, term: value }, () => this.updateTypeConcepts(this.props.concepts));
  }
  onTermUnSelect() {
    this.setState({ hasTerm: false, term: null });
  }
  onTypeChange(type) {
    this.setState({ type });
  }

  updateTypeConcepts(concepts) {
    const typeConcepts = concepts.filter((c) => {
      if (!this.state.hasTerm) {
        return true;
      }
      if (this.state.term && ('type' in this.state.term) && (this.state.term.type in this.props.operations) && (c in this.props.operations[this.state.term.type])) {
        return true;
      }
      return false;
    });
    let { type } = this.state;
    if (typeConcepts.findIndex(c => c === type) < 0) {
      if (typeConcepts.length > 0) {
        type = typeConcepts[0];
      } else {
        type = '';
      }
    }
    this.setState({ typeConcepts, type });
  }

  render() {
    const typeOptions = this.state.typeConcepts.map((c) => {
      const displayConcept = entityNameDisplay(c);
      return (
        <MenuItem
          key={c}
          onClick={() => this.onTypeChange(c)}
        >
          {displayConcept}
        </MenuItem>
      );
    });

    return (
      <AutoSizer disableHeight>
        {({ width }) => (
          <div>
            <Bionames
              concepts={this.props.concepts}
              search={this.props.search}
              onSelect={this.onTermSelect}
              onUnSelect={this.onTermUnSelect}
              width={width}
            />
            <div
              style={{width: width}}
            >
              <DropdownButton
                block
                id="simple-output-type-dropdown"
                title={entityNameDisplay(this.state.type)}
                bsSize={this.props.size}
              >
                {typeOptions}
              </DropdownButton>
            </div>
          </div>
        )}
      </AutoSizer>
    );
  }
}

Expand.defaultProp = {
  search: () => Promise.resolve({ options: [] }),
  concepts: [],
  operations: [],
  onSelect: () => {},
  onUnSelect: () => {},
  size: 'large',
  width: 0, // will be ignored
};

export default Expand;
