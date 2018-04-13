import React from 'react';
import PropTypes from 'prop-types';

import { Button, Media } from 'react-bootstrap';
import GoPlaybackPlay from 'react-icons/lib/go/playback-play';
import GoArrowRight from 'react-icons/lib/go/arrow-right';
import GoCircuitBoard from 'react-icons/lib/go/circuit-board';

import Select from 'react-select';
import Loading from '../Loading';

const _ = require('lodash');

class AnswersetSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedId: null,
      showOverlay: true,
    };

    this.styles = {
      bigButton: {
        margin: 'auto',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    };

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
    let selectedId = null;
    const haveAnAnswerSet = props.answersets && Array.isArray(props.answersets) && props.answersets.length > 0;
    if (haveAnAnswerSet) {
      // Find the newest answerset
      let newest = props.answersets[0];
      let newestDate = new Date(newest.timestamp);
      props.answersets.forEach((a) => {
        const d = new Date(a.timestamp);
        if (d > newestDate) {
          // JS Date object works with standard caomparator
          newestDate = d;
          newest = a;
        }
      });

      selectedId = newest.id;
    }
    return { selectedId, showOverlay: !haveAnAnswerSet };
  }

  getMainContent() {
    const answersetFilter = this.props.answersets.filter(a => a.id === this.state.selectedId);
    // if (answersetFilter.length < 1) {
    //   console.log('Answerset filter failure');
    // }
    // if (answersetFilter.length > 1) {
    //   console.log('Duplicated Answerset IDs');
    // }
    const answerset = answersetFilter[0];

    const d = new Date(answerset.timestamp);
    const timeString = d.toLocaleString();

    return (
      <Media>
        <Media.Left>
          <div style={{ minHeight: '150px', minWidth: '150px', backgroundColor: '#b8c6db' }} />
        </Media.Left>
        <Media.Body>
          <Media.Heading>{timeString}</Media.Heading>
          <p>
            {`Question Hash: ${answerset.question_hash}`}
          </p>
          <div style={this.styles.bigButton}>
            <Button
              bsStyle="primary"
              bsSize="large"
              style={{ minWidth: '150px' }}
              onClick={() => this.props.callbackAnswersetOpen(answerset.id)}
            >
              Explore <GoArrowRight /> <GoCircuitBoard />
            </Button>
          </div>
        </Media.Body>
      </Media>
    );
  }
  handleSelectorChange(selectedOption) {
    this.setState({ selectedId: selectedOption.value });
    console.log(`Selected Answerset: ${selectedOption.label}`);
  }

  renderOverlay() {
    return (
      <div>
        <h4>
          Getting Initial Answers. Please Wait.
        </h4>
        <Loading />
      </div>
    );
  }
  renderStandard() {
    const { showNewButton } = this.props;
    const moreThanOne = this.props.answersets.length > 1;
    const options = this.props.answersets.map((a) => {
      const d = new Date(a.timestamp);
      return { value: a.id, label: d.toLocaleString() };
    });
    return (
      <div>
        <div id="answersetSelect" style={{ display: 'table', width: '100%' }}>
          {!moreThanOne &&
            <div>
              <div style={{ display: 'table-cell', width: '40%' }}>
                {`Answers from ${options[0].label}`}
              </div>
              <div style={{ display: 'table-cell', width: '50%' }} />
            </div>
          }
          {moreThanOne &&
            <div>
              <div style={{ display: 'table-cell', width: '40%' }}>
                {`${this.props.answersets.length} Different Answer Sets Available:`}
              </div>
              <div style={{ display: 'table-cell', width: '50%' }}>
                <Select
                  name="answerset-selector"
                  value={this.state.selectedId}
                  onChange={this.handleSelectorChange}
                  options={options}
                  clearable={false}
                  searchable={false}
                />
              </div>
            </div>
          }
          {showNewButton &&
            <div style={{ display: 'table-cell', width: '34px' }}>
              <Button
                bsSize="small"
                style={{ padding: '5px 13px' }}
                alt="Get a New Answer Set"
                onClick={this.props.callbackAnswersetNew}
                disabled={!this.props.enableNewButton}
              >
                <GoPlaybackPlay />
              </Button>
            </div>
          }
        </div>
        {this.getMainContent()}
      </div>
    );
  }
  render() {
    return (
      <div>
        {this.state.showOverlay &&
          this.renderOverlay()
        }
        {!this.state.showOverlay &&
          this.renderStandard()
        }
      </div>
    );
  }
}

export default AnswersetSelector;
