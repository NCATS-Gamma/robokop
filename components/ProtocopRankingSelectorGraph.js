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
    this.handleClear = this.handleClear.bind(this);
    this.handleClearAll = this.handleClearAll.bind(this);
  }

  handleClear(index) {
    this.handleSelectChange(index, null);
  }
  handleClearAll() {
    this.props.subgraphPossibilities.forEach((p,ind) => this.handleSelectChange(ind, null));
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
        return { value: e.id, label: `${e.score.toFixed(2)}: ` + e.name, score: e.score, name: e.name, id: e.id };
      });
      const background = nodeTypeColorMap[p[0].type] ? nodeTypeColorMap[p[0].type] : undefinedColor;
      const value = this.props.subgraph.nodes[ind].id;
      const thisIsSelected = this.state.isSelected.indexOf(ind) !== -1;

      const numOptions = opts.length;
      const isOnlyOne = numOptions === 1;
      const disableButton = !thisIsSelected;
      const disableSelect = thisIsSelected;

      let style = { border: `2px solid ${background}` };
      if (thisIsSelected) {
        style = { border: '2px solid' };
      }
      
      return (
        <Panel key={shortid.generate()} style={{ backgroundColor: background }}>
          <div className="row">
            <div className="col-md-12" style={{ paddingBottom: '5px' }}>
              <strong style={{ fontSize: '1em' }}> {p[0].type} </strong>
              {!thisIsSelected &&
              <Badge>{numOptions}</Badge>
              }
                {!disableButton &&
                  <div className="pull-right">
                    <Glyphicon glyph="refresh" style={{ cursor: 'pointer' }} onClick={() => this.handleClear(ind)} />
                  </div>
                }
              </div>
          </div>
          <Select
            name={`node_selector_${ind}`}
            value={value}
            onChange={newVal => this.handleSelectChange(ind, newVal)}
            options={opts}
            disabled={disableSelect}
            clearable={false}
            style={style}
            valueRenderer={opt => (<div>{`${opt.name} (${opt.id})`}<span className={'pull-right'} style={{ paddingRight: '15px' }}> {opt.score.toFixed(4)} </span></div>)}
            optionRenderer={opt => (<div>{`${opt.name} (${opt.id})`}<span className={'pull-right'}> {opt.score.toFixed(4)} </span></div>)}
          />
        </Panel>
      );
    });
  }
  render() {
    const dropDowns = this.getAllDropDowns();

    const showReset = this.state.isSelected.length > 0;

    return (
      <div>
        <div style={{ paddingRight: '10px', paddingLeft: '10px'}}>
          <h4>
            {'Answer Explorer'}
            {showReset &&
              <span className={'pull-right'}>
                <Glyphicon glyph="refresh" style={{ cursor: 'pointer' }} onClick={this.handleClearAll} />
              </span>
            }
          </h4>
        </div>
        <PanelGroup style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '10px' }}>
          {dropDowns}
        </PanelGroup>
      </div>
    );
  }
}

export default ProtocopRankingSelectorGraph;
