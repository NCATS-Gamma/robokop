'use babel';

import React from 'react';
import Select from 'react-select';
// import { ButtonGroup, Button, Glyphicon, PanelGroup, Panel } from 'react-bootstrap';

const shortid = require('shortid');

class ProtocopRankingSelectorGraph extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(index, selectedOption) {
    this.props.onSelectionCallback(index, selectedOption);
  }

  getAllDropDowns() {
    const sgp = this.props.subgraphPossibilities;
    return sgp.map((p, ind) => {
      const opts = p.map((e) => {
        return { value: e.id, label: e.name };
      });
      const initValue = p[0];
      return (
        <Select
          key={shortid.generate()}
          name={`node_selector_${ind}`}
          value={initValue}
          onChange={newVal => this.handleChange(ind, newVal)}
          options={opts}
        />
      );
    });
  }
  render() {
    const dropDowns = this.getAllDropDowns();
    const bigList = dropDowns.map(s => (<p key={shortid.generate()}>{s}</p>));
    return (
      <div>
        {bigList}
      </div>
    );
  }
}

export default ProtocopRankingSelectorGraph;
