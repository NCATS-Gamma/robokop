import React from 'react';
import Select from 'react-select';
import { Panel, PanelGroup, Badge, OverlayTrigger, Popover } from 'react-bootstrap';
import { TagCloud } from "react-tagcloud";

import { GoSync, GoEye } from 'react-icons/go';

import getNodeTypeColorMap from '../util/colorUtils';
import entityNameDisplay from '../util/entityNameDisplay';

const shortid = require('shortid');

class AnswersetInteractiveSelector extends React.Component {
  constructor(props) {
    super(props);

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
      const value = this.props.subgraph.result_graph.node_list[ind].id;
      const numOptions = opts.length;
      const isOnlyOne = numOptions === 1;

      const thisIsRealySelected = this.props.nodeSelection[ind] !== null;
      const thisIsSelected = thisIsRealySelected || isOnlyOne; // You might be actually selected

      const disableButton = !thisIsRealySelected;
      const disableSelect = thisIsSelected;

      let style = { border: '2px solid #eee' };
      if (thisIsSelected) {
        style = { border: '2px solid #444' };
      }
      const showWordCloud = !thisIsSelected;
      let wordCloudPopover = (<div />);

      if (showWordCloud) {
        const wordCloudTitle = `${entityNameDisplay(p[0].type)} Word Cloud`;

        const wordCloudData = p.map((e, i) => ({
          value: e.name,
          count: e.score,
          key: e.id,
          opt: opts[i],
        }));

        const wordCloudRenderer = (tag, size, color) => (
          <span
            className="tag-cloud-tag"
            key={tag.key}
            style={{
              color,
              fontSize: `${size}px`,
              cursor: 'pointer',
              margin: '0px 3px',
              verticalAlign: 'middle',
              display: 'inline-block',
            }}
          >
            {tag.value}
          </span>
        );

        wordCloudPopover = (
          <Popover
            id="popover-wordcloud"
            title={wordCloudTitle}
            style={{ minWidth: '750px', minHeight: '350px' }}
          >
            <TagCloud
              minSize={12}
              maxSize={35}
              tags={wordCloudData}
              colorOptions={{
                luminosity: 'dark',
              }}
              style={{ textAlign: 'center' }}
              renderer={wordCloudRenderer}
              onClick={tag => this.handleSelectChange(ind, tag.opt)}
            />
          </Popover>
        );
      }

      return (
        <Panel key={shortid.generate()} style={{ margin: '5px 5px 0 5px' }}>
          <Panel.Heading style={{ backgroundColor: background }}>
            {entityNameDisplay(p[0].type)}
            {!thisIsRealySelected &&
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
            {showWordCloud &&
              <div className="pull-right">
                <OverlayTrigger
                  trigger="click"
                  placement="right"
                  rootClose
                  overlay={wordCloudPopover}
                >
                  <GoEye style={{ cursor: 'pointer' }} />
                </OverlayTrigger>
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
    this.props.onSelectionCallback(index, selectedOption);
  }

  render() {
    const dropDowns = this.getAllDropDowns();

    const showReset = this.props.nodeSelection.reduce((val, n) => val || n !== null, false);

    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            Answer Selector
            {showReset &&
              <span className="pull-right">
                <GoSync style={{ cursor: 'pointer' }} onClick={this.handleClearAll} />
              </span>
            }
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body style={{ backgroundColor: '#f5f7fa', padding: '2px' }}>
          <PanelGroup id="AnswerSetExplorer">
            {dropDowns}
          </PanelGroup>
        </Panel.Body>
      </Panel>
    );
  }
}

export default AnswersetInteractiveSelector;
