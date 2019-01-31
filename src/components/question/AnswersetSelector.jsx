import React from 'react';

import { Row, Col, Button } from 'react-bootstrap';
import GoPlaybackPlay from 'react-icons/lib/go/playback-play';
import GoArrowRight from 'react-icons/lib/go/arrow-right';
import GoCircuitBoard from 'react-icons/lib/go/circuit-board';

import Select from 'react-select';
import { DropdownList } from 'react-widgets';
import Loading from '../Loading';

const _ = require('lodash');

class AnswersetSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      answersets: [],
      selectedId: null,
      showOverlay: true,
    };

    // this.styles = {
    //   bigButton: {
    //     margin: 'auto',
    //     padding: '10px',
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //   },
    // };

    this.handleSelectorChange = this.handleSelectorChange.bind(this);
    this.getUpdatedState = this.getUpdatedState.bind(this);
  }
  componentDidMount() {
    this.setState(this.getUpdatedState(this.props));
  }

  componentWillReceiveProps(nextProps, prevState) {
    if (!_.isEqual(nextProps.answersets, this.props.answersets)) {
      this.setState(this.getUpdatedState(nextProps));
    }
  }

  getUpdatedState(props) {
    const haveAnAnswerSet = props.answersets && Array.isArray(props.answersets) && props.answersets.length > 0;
    if (haveAnAnswerSet) {
      const answersetDates = props.answersets.map((a) => {
        let ts = a.timestamp;
        if (!ts.endsWith('Z')) {
          ts = `${ts}Z`;
        }
        return new Date(ts);
      });

      const inds = Array.apply(null, Array(answersetDates.length)).map(() => {}); // eslint-disable-line
      const sortingInds = (inds).map((v, i) => i);
      sortingInds.sort((a, b) => (answersetDates[b] - answersetDates[a]));
      const answersets = sortingInds.map(v => props.answersets[v]);

      this.props.callbackOnSelect(answersets[0].id);

      return { answersets, selectedId: answersets[0].id, showOverlay: false };
    }

    return { answersets: [], selectedId: null, showOverlay: true };
  }

  handleSelectorChange(selectedOption) {
    this.setState({ selectedId: selectedOption.value }, () => this.props.callbackOnSelect(selectedOption.value));
  }

  render() {
    const options = this.state.answersets.map((a) => {
      let ts = a.timestamp;
      if (!ts.endsWith('Z')) {
        ts = `${ts}Z`;
      }
      const d = new Date(ts);
      const timeString = d.toLocaleString();

      return { value: a.id, label: `${timeString}` };
    });

    return (
      <div style={{ minWidth: '300px' }}>
        <div id="answersetSelect" style={{ display: 'table', width: '100%' }}>
          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', width: '100%' }}>
              <DropdownList
                data={options}
                textField="label"
                valueField="value"
                onChange={this.handleSelectorChange}
                value={this.state.selectedId}
                disabled={options.length < 2}
              />
            </div>
          </div>
          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', width: '100%', textAlign: 'center', paddingTop: '10px' }}>
              <Button
                bsStyle="primary"
                bsSize="large"
                style={{ minWidth: '150px' }}
                href={this.props.answersetUrl(this.state.answersets.filter(a => a.id === this.state.selectedId)[0])}
              >
                Explore <GoArrowRight /> <GoCircuitBoard />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

AnswersetSelector.defaultProps = {
  question: {},
  answersets: [],
  callbackOnSelect: (selectedAnswersetId) => {},
};

export default AnswersetSelector;
