import React from 'react';
import { Button } from 'react-bootstrap';
import { GoArrowRight, GoCircuitBoard } from 'react-icons/go';
import { DropdownList } from 'react-widgets';

const _ = require('lodash');

class AnswersetSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      answersets: [],
      selectedId: null,
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

    this.initializeState = this.initializeState.bind(this);
    this.handleSelectorChange = this.handleSelectorChange.bind(this);
    this.getUpdatedState = this.getUpdatedState.bind(this);
  }
  componentDidMount() {
    this.initializeState();
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.answersets, this.props.answersets)) {
      this.setState(this.getUpdatedState(nextProps));
    }
  }

  initializeState() {
    this.setState(this.getUpdatedState(this.props));
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

      return { answersets, selectedId: answersets[0].id };
    }

    return { answersets: [], selectedId: null };
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
            <div style={{
                display: 'table-cell',
                width: '100%',
                textAlign: 'center',
                paddingTop: '10px',
              }}
            >
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
  callbackOnSelect: () => {},
};

export default AnswersetSelector;
