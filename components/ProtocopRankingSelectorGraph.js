'use babel';

import React from 'react';
import Select from 'react-select';
// import { ButtonGroup, Button, Glyphicon, PanelGroup, Panel } from 'react-bootstrap';

const shortid = require('shortid');

class ProtocopRankingSelectorGraph extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.state = {
      selectedValues: [],
    };

    this.getSelectedValues = this.getSelectedValues.bind(this);
  }

  getSelectedValues() {
    const selectedValues = this.props.subgraph.nodes.map(s => s.id);
    this.setState({ selectedValues });
  }
  componentWillReceiveProps(newProps) {
    this.getSelectedValues();
  }
  handleChange(index, selectedOption) {
    this.props.onSelectionCallback(index, selectedOption);
  }

  getAllDropDowns() {
    const sgp = this.props.subgraphPossibilities;
    const selectedValues = this.state.selectedValues;
    return sgp.map((p, ind) => {
      const opts = p.map((e) => {
        return { value: e, label: e };
      });
      const value = selectedValues[ind];
      return (
        <Select
          key={shortid.generate()}
          name={`node_selector_${ind}`}
          value={value}
          onChange={newVal => this.handleChange(ind, newVal)}
          options={opts}
        />
      );
    });
  }
  render() {
    const dropDowns = this.getAllDropDowns();
    return (
      <div>
        {dropDowns}
      </div>
    );
  }
}

export default ProtocopRankingSelectorGraph;
