import React from 'react';

import { Row, Col, Button } from 'react-bootstrap';
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
    let selectedId = null;
    const haveAnAnswerSet = props.answersets && Array.isArray(props.answersets) && props.answersets.length > 0;
    if (haveAnAnswerSet) {
      // Find the newest answerset
      let newest = props.answersets[0];
      let newestDate = new Date(newest.datetime);
      props.answersets.forEach((a) => {
        const d = new Date(a.datetime);
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

    let ts = answerset.datetime;
    if (!ts.endsWith('Z')) {
      ts = `${ts}Z`;
    }
    const d = new Date(ts);
    const timeString = d.toLocaleString();

    let { message } = answerset;
    if (message == null || message.length < 1) {
      message = 'No Message Provided';
    }
    let { creator } = answerset;
    if (creator === undefined || creator == null) {
      creator = '';
    }
    return (
      <div style={{ paddingTop: '5px' }}>
        <Row>
          <Col md={12}>
            <h4>{creator}</h4>
            <h5>{timeString}</h5>
            <pre>
              {message}
            </pre>
          </Col>
        </Row>
        <Row>
          <Col md={4} mdOffset={4}>
            <Button
              bsStyle="primary"
              bsSize="large"
              style={{ minWidth: '150px' }}
              // onClick={() => this.props.callbackAnswersetOpen(answerset.id)}
              href={this.props.answersetUrl(answerset)}
            >
              Explore <GoArrowRight /> <GoCircuitBoard />
            </Button>
          </Col>
        </Row>
      </div>
    );
  }
  handleSelectorChange(selectedOption) {
    this.setState({ selectedId: selectedOption.value });
  }

  renderOverlay() {
    const disableNewButton = !this.props.answerBusy || !this.props.refreshBusy || !this.props.initializerBusy;
    return (
      <div>
        {this.props.initializerBusy &&
          <div>
            <h4>
              Getting Initial Answers. Please Wait.
            </h4>
            <Loading />
          </div>
        }
        {!this.props.initializerBusy && !(this.props.answerBusy || this.props.refreshBusy) &&
          <div>
            <Row>
              <Col md={12}>
                <h4>
                  No answer sets available.
                </h4>
                <p>
                  This may indicate a problem in the construction of the question, or a lack of available information.
                </p>
              </Col>
            </Row>
            <Row style={{ paddingTop: '10px' }}>
              <Col md={4} mdOffset={4}>
                <Button
                  bsSize="large"
                  alt="Get a New Answer Set"
                  onClick={this.props.callbackAnswersetNew}
                >
                  Get New Answers
                  <br />
                  <GoPlaybackPlay />
                </Button>
              </Col>
            </Row>
          </div>
        }
        {!this.props.initializerBusy && (this.props.answerBusy || this.props.refreshBusy) &&
          <div>
            <Row>
              <Col md={12}>
                <h4>
                  {this.props.answerBusy &&
                    <span>
                      We are working on getting new answers for this question. Please wait.
                    </span>
                  }
                  {this.props.refreshBusy &&
                    <span>
                      We are working on updating the knowledge graph for this question. Please wait.
                    </span>
                  }
                </h4>
              </Col>
            </Row>
            <Loading />
          </div>
        }
      </div>
    );
  }
  renderStandard() {
    const { showNewButton } = this.props;
    const moreThanOne = this.props.answersets.length > 1;
    const options = this.props.answersets.map((a) => {
      const d = new Date(a.datetime);
      let { creator } = a;
      if (creator === undefined || creator == null) {
        creator = '';
      } else {
        creator = ` - ${creator}`;
      }
      return { value: a.id, label: `${d.toLocaleString()} ${creator}` };
    });
    const disableNewButton = this.props.answerBusy || this.props.refreshBusy || this.props.initializerBusy;
    return (
      <div>
        <div id="answersetSelect" style={{ display: 'table', width: '100%' }}>
          {!moreThanOne &&
            <div>
              <div style={{ display: 'table-cell', width: '100%' }}>
                {`Answers from ${options[0].label}`}
              </div>
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
                disabled={disableNewButton}
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
