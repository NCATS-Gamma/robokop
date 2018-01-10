'use babel';

import React from 'react';
import Select from 'react-select';
// import { ButtonGroup, Button, Glyphicon, PanelGroup, Panel } from 'react-bootstrap';

const shortid = require('shortid');

class ProtocopRankingSelectorGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isSelected: [],
    };

    this.handleSelectChange = this.handleSelectChange.bind(this);
  }

  handleSelectChange(index, selectedOption) {
    this.props.onSelectionCallback(index, selectedOption);
  }

  getAllDropDowns() {
    const sgp = this.props.subgraphPossibilities;
    return sgp.map((p, ind) => {
      const opts = p.map((e) => {
        return { value: e, label: e };
      });
      const value = this.props.subgraph.nodes[ind].id;
      const thisIsSelected = this.state.isSelected.indexOf(ind) !== -1;

      let style = {};
      if (thisIsSelected) {
        style = { color: 'red' };
      }
      return (

        <Select
          key={shortid.generate()}
          name={`node_selector_${ind}`}
          value={value}
          style={style}
          onChange={newVal => this.handleSelectChange(ind, newVal)}
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
