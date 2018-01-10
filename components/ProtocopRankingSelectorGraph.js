'use babel';

import React from 'react';
import Select from 'react-select';
import { Button, Glyphicon, Panel, PanelGroup, Badge } from 'react-bootstrap';
import NodeTypes from './ProtocopQueryEditorNodeTypes';

const shortid = require('shortid');

class ProtocopRankingSelectorGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isSelected: [],
    };

    this.handleSelectChange = this.handleSelectChange.bind(this);
  }

  handleClear(index) {
    this.handleSelectChange(index, null);
  }
  handleSelectChange(index, selectedOption) {
    if (selectedOption !== null) {
      const isSelected = this.state.isSelected;
      isSelected.push(index);
      this.setState({ isSelected });
    } else {
      const isSelected = this.state.isSelected;
      const indexIndex = isSelected.indexOf(index);
      if (indexIndex > -1) {
        isSelected.splice(indexIndex, 1);
      }
      this.setState({ isSelected });
    }
    this.props.onSelectionCallback(index, selectedOption);
  }

  getAllDropDowns() {
    const sgp = this.props.subgraphPossibilities;
    const undefinedColor = '#f2f2f2';
    const nodeTypeColorMap = {};
    Object.keys(NodeTypes).forEach(k => (nodeTypeColorMap[NodeTypes[k].tag] = NodeTypes[k].color));
    return sgp.map((p, ind) => {
      const opts = p.map((e) => {
        return { value: e.id, label: `${e.score.toFixed(2)}: ` + e.name, score: e.score, name: e.name };
      });
      const background = nodeTypeColorMap[p[0].type] ? nodeTypeColorMap[p[0].type] : undefinedColor;
      const value = this.props.subgraph.nodes[ind].id;
      const thisIsSelected = this.state.isSelected.indexOf(ind) !== -1;

      const numOptions = opts.length;
      const isOnlyOne = numOptions === 1;
      const disableButton = !thisIsSelected;
      const disableSelect = isOnlyOne || thisIsSelected;
      // valueRenderer={opt => (<strong>{`${opt.label} - Max Score - ${opt.score.toFixed(4)}`}</strong>)}
      return (
        <Panel key={shortid.generate()} style={ {backgroundColor: background} }>
          <div className="row">
            <div className="col-md-12">
              <span style={{ fontSize: '1em' }}> {p[0].type} </span>
              <Badge>{numOptions}</Badge>
              <div className="pull-right">
                <Button disabled={disableButton} onClick={() => this.handleClear(ind)}>
                  <Glyphicon glyph="refresh" />
                </Button>
              </div>
            </div>
          </div>
          <Select
            name={`node_selector_${ind}`}
            value={value}
            onChange={newVal => this.handleSelectChange(ind, newVal)}
            options={opts}
            disabled={disableSelect}
            clearable={false}
            valueRenderer={opt => (<div>{opt.name}<span className={'pull-right'} style={{ paddingRight: '15px' }}> {opt.score.toFixed(4)} </span></div>)}
            optionRenderer={opt => (<div>{opt.name}<span className={'pull-right'}> {opt.score.toFixed(4)} </span></div>)}
          />
        </Panel>
      );
    });
  }
  render() {
    const dropDowns = this.getAllDropDowns();
    return (
      <PanelGroup>
        {dropDowns}
      </PanelGroup>
    );
  }
}

export default ProtocopRankingSelectorGraph;
