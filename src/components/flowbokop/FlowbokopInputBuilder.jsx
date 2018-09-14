import React from 'react';
import PropTypes from 'prop-types';

import { Form, FormControl, Button, Glyphicon } from 'react-bootstrap';
import FaPlus from 'react-icons/lib/fa/plus';
import AppConfig from './../../AppConfig';
import Loading from './../Loading';
import LabeledFormGroup from './../shared/LabeledFormGroup';
import CurieSelectorContainer from './../shared/CurieSelectorContainer';

const _ = require('lodash');
const shortid = require('shortid');


const propTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }).isRequired,
  onChangeHook: PropTypes.func, // (curieList, inputLabel, isValid) => {}
  panelObj: PropTypes.shape({
    inputType: PropTypes.string.isRequired,
    inputLabel: PropTypes.string.isRequired,
    isValid: PropTypes.bool.isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      curie: PropTypes.string.isRequired,
    })),
  }).isRequired,
  // inputLabel: PropTypes.string.isRequired,
  // onChangeLabel: PropTypes.func,
};

const defaultProps = {
  onChangeHook: () => {},
  // onChangeLabel: () => {},
  // inputCurieList: [{ type: 'disease', label: '', curie: '' }],
};

class FlowbokopInputBuilder extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      concepts: [],
      isValid: false,
      submittedJSON: [],
    };

    this.state.keys = this.state.submittedJSON.map(() => shortid.generate());

    this.onSearch = this.onSearch.bind(this);
    // this.handleRawJsonChange = this.handleRawJsonChange.bind(this);
    this.updateCurie = this.updateCurie.bind(this);
    this.addCurie = this.addCurie.bind(this);
    this.deleteCurie = this.deleteCurie.bind(this);
    this.curieListFromSubmittedJSON = this.curieListFromSubmittedJSON.bind(this);
    this.submittedJSONFromCurieList = this.submittedJSONFromCurieList.bind(this);
    this.isValidInput = this.isValidInput.bind(this);
    this.onChangeFactory = this.onChangeFactory.bind(this);

    // Replace 'label' param with 'term' param
    if (_.isPlainObject(props.panelObj.data)) {
      this.state.submittedJSON = this.submittedJSONFromCurieList([props.panelObj.data]);
    } else {
      this.state.submittedJSON = this.submittedJSONFromCurieList(props.panelObj.data);
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
    if (!_.isEqual(nextProps.panelObj.data, this.props.panelObj.data)) {
      let inputCurieList;
      if (_.isPlainObject(nextProps.panelObj.data)) {
        inputCurieList = this.submittedJSONFromCurieList([nextProps.panelObj.data]);
      } else {
        inputCurieList = this.submittedJSONFromCurieList(nextProps.panelObj.data);
      }
      let { keys } = this.state;
      // Only regenerate keys if different number of input Curie lists are in the new props
      if (this.state.submittedJSON.length !== inputCurieList.length) {
        keys = inputCurieList.map(() => shortid.generate());
      }
      this.setState({ submittedJSON: inputCurieList, keys });
      // () => this.props.onChangeHook(this.curieListFromSubmittedJSON()),
      // );
    }
  }

  // componentDidUpdate(prevProps) {
  //   // Update isValid state of entire panel any time the panel data changes
  //   if (!_.isEqual(prevProps.panelObj, this.props.panelObj.data)) {
  //     this.isValidInput(this.props.panelObj, () => {
  //       const curieList = _.cloneDeep(this.props.panelObj.data);
  //       this.props.onChangeHook(Object.assign({}, curieList, { isValid: this.state.isValid, inputLabel: this.props.panelObj.inputLabel }));
  //     });
  //   }
  // }

  /**
   * Handles publishing any onChange events to supplied onChangeHook method in props
   * @param {*} tag {'curieList' or 'inputLabel'}
   */
  onChangeFactory(tag) {
    return (val) => {
      const curieList = this.curieListFromSubmittedJSON();
      const inputLabel = tag === 'inputLabel' ? val.target.value : this.props.panelObj.inputLabel;
      const panelObj = { data: curieList, inputLabel };
      this.isValidInput(panelObj, () => {
        panelObj.isValid = this.state.isValid;
        panelObj.curieList = panelObj.data;
        delete panelObj.data;
        // console.log('in onChangeFactory:', defaultObj, this.state.isValid);
        this.props.onChangeHook(panelObj);
      });
    };
  }

  isValidLabel(val) {
    return /^[a-z0-9_ ]+$/i.test(val);
  }
  isValidCurie(val) {
    return /^[a-z0-9_\+\-]+:[a-z0-9_\+\-]+/i.test(val); // eslint-disable-line no-useless-escape
  }
  isValidCurieList(val) {
    if (_.isPlainObject(val)) {
      val = [val];
    }
    let isValid = true;
    val.forEach((curieObj) => {
      const { curie, type } = curieObj;
      isValid = isValid && this.isValidCurie(curie);
      isValid = isValid && (this.state.concepts.indexOf(type) > -1); // Ensure type is in concept list
    });
    // Ensure all types in the CurieList are identical
    if (isValid) {
      const curieTypes = val.map(curieBlob => curieBlob.type);
      isValid = isValid && curieTypes.every((t, i, arr) => t === arr[0]);
    }
    return isValid;
  }
  isValidInput(panelObj, callbackFn) {
    const { inputLabel, data } = panelObj;
    const isValid = this.isValidLabel(inputLabel) && this.isValidCurieList(data);
    this.setState({ isValid }, callbackFn);
  }
  onSearch(input, nodeType) {
    return this.appConfig.questionNewSearch(input, nodeType);
  }
  defaultCurie() {
    // Return default curie for new CurieSelector such that the returned type
    // always matches that of the 1st CurieSelector element in the panel
    return { type: this.state.submittedJSON[0].type, term: '', curie: '' };
  }
  deleteCurie(i) {
    const submittedJSON = _.cloneDeep(this.state.submittedJSON);
    const keys = _.cloneDeep(this.state.keys);
    submittedJSON.splice(i, 1);
    keys.splice(i, i);
    this.setState(
      { submittedJSON, keys },
      this.onChangeFactory('curieList'),
    );
  }
  addCurie() {
    const submittedJSON = _.cloneDeep(this.state.submittedJSON);
    const keys = _.cloneDeep(this.state.keys);
    submittedJSON.push(this.defaultCurie());
    keys.push(shortid.generate());
    this.setState(
      { submittedJSON, keys },
      this.onChangeFactory('curieList'),
    );
  }
  updateCurie(i, type, term, curie) {
    const submittedJSON = _.cloneDeep(this.state.submittedJSON);
    submittedJSON[i] = { type, term, curie };
    const keys = _.cloneDeep(this.state.keys);
    // Check if type of 1st Curie List was changed
    if ((i === 0) && (submittedJSON.length > 1) && (submittedJSON[0].type !== submittedJSON[1].type)) {
      submittedJSON.splice(1); // Delete all other CurieSelectors except first
      keys.splice(1);
    }
    this.setState(
      { submittedJSON, keys },
      this.onChangeFactory('curieList'),
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
    });
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
      curieSelectorElements = submittedJSON.map((jsonBlob, i) => {
        const curieSelectorElement = (
          <div style={{ display: 'table-row' }} key={this.state.keys[i]} >
            <div
              style={{ display: 'table-cell', padding: '5px 0px' }}
            >
              <CurieSelectorContainer
                concepts={this.state.concepts}
                search={this.onSearch}
                disableType={i !== 0} // Only enable for 1st CurieSelector element
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
      });
    }
    const classNames = {
      formLabel: 'col-md-2 form-label',
      formControl: 'col-md-10',
    };
    return (
      <div
        id="searchBionames"
      >
        <Form horizontal>
          <LabeledFormGroup
            formLabel="Input"
            value={this.props.panelObj.inputLabel}
            // validationHookFn={validationState => this.updateValidationStatus('input', validationState)}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={this.props.panelObj.inputLabel}
              // placeholder={''}
              onChange={this.onChangeFactory('inputLabel')}
            />
          </LabeledFormGroup>
        </Form>
        <div style={{ display: 'table', width: '100%' }}>
          {curieSelectorElements}
          <div style={{ display: 'table-row', textAlign: 'center' }}>
            <Button style={{ marginTop: '10px' }} onClick={this.addCurie}>
              <FaPlus style={{ verticalAlign: 'text-top' }} />{' Add Curie'}
            </Button>
          </div>
        </div>
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
