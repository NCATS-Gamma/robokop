import React from 'react';
import PropTypes from 'prop-types';

import { Form, FormGroup, ControlLabel, FormControl, Button, Glyphicon } from 'react-bootstrap';
import { AutoSizer } from 'react-virtualized';

import AppConfig from './../../AppConfig';
import Loading from './../Loading';

import CurieSelectorContainer from './../shared/CurieSelectorContainer';

const _ = require('lodash');
const shortid = require('shortid');


const propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }).isRequired,
  onChangeHook: PropTypes.func, // Returns updated CurieList state on any internal state changes
  inputCurieList: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    curie: PropTypes.string.isRequired,
  })),
  inputLabel: PropTypes.string.isRequired,
  onChangeLabel: PropTypes.func,
};

const defaultProps = {
  onChangeHook: () => {},
  onChangeLabel: () => {},
  inputCurieList: [{ type: 'disease', label: '', curie: '' }],
};

class FlowbokopInputBuilder extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      // userReady: false,
      // user: {},
      concepts: [],
      // rawInputJson: '',
      submittedJSON: _.isPlainObject(props.inputCurieList) ? [props.inputCurieList] : props.inputCurieList,
    };

    this.state.keys = this.state.submittedJSON.map(() => shortid.generate());

    this.onSearch = this.onSearch.bind(this);
    // this.handleRawJsonChange = this.handleRawJsonChange.bind(this);
    this.updateCurie = this.updateCurie.bind(this);
    this.addCurie = this.addCurie.bind(this);
    this.deleteCurie = this.deleteCurie.bind(this);
    this.curieListFromSubmittedJSON = this.curieListFromSubmittedJSON.bind(this);
    this.submittedJSONFromCurieList = this.submittedJSONFromCurieList.bind(this);

    // Replace 'label' param with 'term' param
    if (_.isPlainObject(props.inputCurieList)) {
      this.state.submittedJSON = this.submittedJSONFromCurieList([props.inputCurieList]);
    } else {
      this.state.submittedJSON = this.submittedJSONFromCurieList(props.inputCurieList);
    }
  }

  componentDidMount() {
    // this.appConfig.user(data => this.setState({
    //   user: this.appConfig.ensureUser(data),
    //   userReady: true,
    // }));
    this.appConfig.concepts((data) => {
      this.setState({
        concepts: data,
        dataReady: true,
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    // Reset display of CurieListSelector component if inputCurieList prop changes
    if (!_.isEqual(nextProps.inputCurieList, this.props.inputCurieList)) {
      let inputCurieList;
      if (_.isPlainObject(nextProps.inputCurieList)) {
        inputCurieList = this.submittedJSONFromCurieList([nextProps.inputCurieList]);
      } else {
        inputCurieList = this.submittedJSONFromCurieList(nextProps.inputCurieList);
      }
      let { keys } = this.state;
      // Only regenerate keys if different number of input Curie lists are in the new props
      if (this.state.submittedJSON.length !== inputCurieList.length) {
        keys = inputCurieList.map(() => shortid.generate());
      }
      this.setState(
        { submittedJSON: inputCurieList, keys },
        () => this.props.onChangeHook(this.curieListFromSubmittedJSON()),
      );
    }
  }

  onSearch(input, nodeType) {
    return this.appConfig.questionNewSearch(input, nodeType);
  }
  defaultCurie() {
    return { type: 'disease', term: '', curie: '' };
  }
  deleteCurie(i) {
    const submittedJSON = _.cloneDeep(this.state.submittedJSON);
    const keys = _.cloneDeep(this.state.keys);
    submittedJSON.splice(i, 1);
    keys.splice(i, i);
    this.setState(
      { submittedJSON, keys },
      () => this.props.onChangeHook(this.curieListFromSubmittedJSON()),
    );
  }
  addCurie() {
    const submittedJSON = _.cloneDeep(this.state.submittedJSON);
    const keys = _.cloneDeep(this.state.keys);
    submittedJSON.push(this.defaultCurie());
    keys.push(shortid.generate());
    this.setState(
      { submittedJSON, keys },
      () => this.props.onChangeHook(this.curieListFromSubmittedJSON()),
    );
  }
  updateCurie(i, type, term, curie) {
    const submittedJSON = _.cloneDeep(this.state.submittedJSON);
    submittedJSON[i] = { type, term, curie };
    this.setState(
      { submittedJSON },
      () => this.props.onChangeHook(this.curieListFromSubmittedJSON()),
    );
  }
  curieListFromSubmittedJSON() {
    const submittedJSON = _.cloneDeep(this.state.submittedJSON);
    submittedJSON.map((blob) => {
      blob.label = blob.term;
      delete blob.term;
    });
    return submittedJSON;
  }
  submittedJSONFromCurieList(curieList) {
    // Replaces 'label' param with 'term' param
    const cL = _.cloneDeep(curieList);
    cL.map((blob) => {
      blob.term = blob.label;
      delete blob.label;
    })
    return cL;
  }
  // handleRawJsonChange(event) {
  //   this.setState({ rawInputJson: event.target.value });
  // }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    let curieSelectorElements;
    let { submittedJSON } = this.state;
    if (_.isPlainObject(submittedJSON)) {
      submittedJSON = [submittedJSON];
    }
    if (Array.isArray(submittedJSON)) {
      curieSelectorElements = width => (
        submittedJSON.map((jsonBlob, i) => {
          const curieSelectorElement = (
            <div style={{ display: 'table-row' }} key={this.state.keys[i]} >
              <div
                style={{ display: 'table-cell', padding: '5px 0px' }}
              >
                <CurieSelectorContainer
                  concepts={this.state.concepts}
                  search={(input, nodeType) => this.onSearch(input, nodeType)}
                  width={width - 40}
                  displayType
                  initialInputs={jsonBlob}
                  onChangeHook={(ty, te, cu) => this.updateCurie(i, ty, te, cu)}
                />
              </div>
              <div
                style={{
                  display: 'table-cell', width: '30px', verticalAlign: 'middle', paddingLeft: '10px',
                }}
              >
                {(i !== 0) &&
                  <Button
                    bsStyle="default"
                    onClick={() => this.deleteCurie(i)}
                    style={{ padding: '8px' }}
                  >
                    <Glyphicon glyph="trash" />
                  </Button>
                }
              </div>
            </div>
          );
          return curieSelectorElement;
        })
      );
    }
    return (
      <div>
        <AutoSizer disableHeight>
          {({ width }) => (
            <div
              id="searchBionames"
            >
              <Form inline>
                <FormGroup controlId="formInlineInputLabel">
                  <ControlLabel>Input Label:</ControlLabel>{' '}
                  <FormControl
                    type="text"
                    value={this.props.inputLabel}
                    onChange={this.props.onChangeLabel}
                  />
                </FormGroup>
              </Form>
              <div style={{ display: 'table' }}>
                {curieSelectorElements(width)}
                <div style={{ display: 'table-row', textAlign: 'center' }}>
                  <Button
                    bsStyle="default"
                    bsSize="sm"
                    style={{ marginTop: '20px' }}
                    onClick={() => this.addCurie()}
                  >
                    <Glyphicon glyph="plus" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </AutoSizer>
      </div>
    );
  }
  render() {
    const ready = this.state.dataReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

FlowbokopInputBuilder.propTypes = propTypes;
FlowbokopInputBuilder.defaultProps = defaultProps;

export default FlowbokopInputBuilder;
