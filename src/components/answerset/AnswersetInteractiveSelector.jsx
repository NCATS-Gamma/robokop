import React from 'react';
import Select from 'react-select';
import { Panel, PanelGroup, Badge } from 'react-bootstrap';

import GoSync from 'react-icons/lib/go/sync';

import getNodeTypeColorMap from '../questionNew/ColorUtils';

const shortid = require('shortid');

class AnswersetInteractiveSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isSelected: [],
    };

    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleClearAll = this.handleClearAll.bind(this);
  }

  getAllDropDowns() {
    const sgp = this.props.subgraphPossibilities;
    const nodeTypeColorMap = getNodeTypeColorMap(this.props.concepts);
    return sgp.map((p, ind) => {
      const opts = p.map(e => ({
        value: e.id,
        label: `${e.score.toFixed(2)}: ${e.name}`,
        score: e.score,
        name: e.name,
      }));
      const background = nodeTypeColorMap(p[0].type);
      const value = this.props.subgraph.nodes[ind].id;
      const thisIsSelected = this.state.isSelected.indexOf(ind) !== -1;

      const numOptions = opts.length;
      const isOnlyOne = numOptions === 1;
      const disableButton = !thisIsSelected;
      const disableSelect = thisIsSelected;

      let style = { border: `2px solid #eee` };
      if (thisIsSelected) {
        style = { border: '2px solid #444' };
      }

      return (
        <Panel key={shortid.generate()}>
          <Panel.Heading style={{ backgroundColor: background }}>
            {p[0].type}
            {!thisIsSelected &&
              <span>
                &nbsp;
                <Badge>{numOptions}</Badge>
              </span>
            }
            {!disableButton &&
              <div className="pull-right">
                <GoSync style={{ cursor: 'pointer' }} onClick={() => this.handleClear(ind)} />
              </div>
            }
          </Panel.Heading>
          <Panel.Body>
            <Select
              name={`node_selector_${ind}`}
              value={value}
              onChange={newVal => this.handleSelectChange(ind, newVal)}
              options={opts}
              disabled={disableSelect}
              clearable={false}
              style={style}
              valueRenderer={opt => (<div>{opt.name}<span className="pull-right" style={{ paddingRight: '15px' }}> {opt.score.toFixed(4)} </span></div>)}
              optionRenderer={opt => (<div>{opt.name}<span className="pull-right"> {opt.score.toFixed(4)} </span></div>)}
            />
          </Panel.Body>
        </Panel>
      );
    });
  }

  handleClear(index) {
    this.handleSelectChange(index, null);
  }

  handleClearAll() {
    this.props.subgraphPossibilities.forEach((p, ind) => this.handleSelectChange(ind, null));
  }

  handleSelectChange(index, selectedOption) {
    const { isSelected } = this.state;

    if (selectedOption !== null) {
      isSelected.push(index);
      this.setState({ isSelected });
    } else {
      const indexIndex = isSelected.indexOf(index);
      if (indexIndex > -1) {
        isSelected.splice(indexIndex, 1);
      }
      this.setState({ isSelected });
    }
    this.props.onSelectionCallback(index, selectedOption);
  }

  render() {
    const dropDowns = this.getAllDropDowns();

    const showReset = this.state.isSelected.length > 0;

    return (
      <div>
        <h4>
          Answer Explorer
          {showReset &&
            <span className="pull-right">
              <GoSync style={{ cursor: 'pointer' }} onClick={this.handleClearAll} />
            </span>
          }
        </h4>
        <PanelGroup id="AnswerSetExplorer">
          {dropDowns}
        </PanelGroup>
      </div>
    );
  }
}

export default AnswersetInteractiveSelector;
