import React from 'react';
import PropTypes from 'prop-types';

import { Form, FormControl } from 'react-bootstrap';
import Multiselect from 'react-widgets/lib/Multiselect';
// import { AutoSizer } from 'react-virtualized';
import LabeledFormGroup from './../shared/LabeledFormGroup';

const _ = require('lodash');

const propTypes = {
  panelObj: PropTypes.shape({
    inputType: PropTypes.string.isRequired,
    data: PropTypes.shape({
      input: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
      output: PropTypes.string.isRequired,
      service: PropTypes.string.isRequired,
      options: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onChangeHook: PropTypes.func, // Form of ({input, output, label, service, options, isValid}) => {}
  // onInputSelect: PropTypes.func, // Callback when input(s) selection changes (value) => {}
  inputLabelList: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const defaultProps = {
  onChangeHook: () => {},
  // onInputSelect: () => {},
};

const classNames = {
  formLabel: 'col-md-2 form-label',
  formControl: 'col-md-10',
};

class FlowbokopOperationBuilder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // validationStatus: {
      //   input: '',
      //   output: '',
      //   label: '',
      //   service: '',
      //   options: '',
      // },
      isValid: false,
    };

    this.isValidInput = this.isValidInput.bind(this);
    this.isValidLabel = this.isValidLabel.bind(this);
    this.isValidOptions = this.isValidOptions.bind(this);
    this.isValidOutput = this.isValidOutput.bind(this);
    this.isValidService = this.isValidService.bind(this);
    this.validateFormElement = this.validateFormElement.bind(this);
  }

  componentDidMount() {
    this.isValidOperation(this.props.panelObj.data, () => {
      const defaultObj = _.cloneDeep(this.props.panelObj.data);
      this.props.onChangeHook(Object.assign({}, defaultObj, { isValid: this.state.isValid }));
    });
  }

  componentDidUpdate(prevProps) {
    // Update isValid state of entire panel any time the panel data changes
    if (!_.isEqual(prevProps.panelObj.data, this.props.panelObj.data)) {
      this.isValidOperation(this.props.panelObj.data, () => {
        const defaultObj = _.cloneDeep(this.props.panelObj.data);
        this.props.onChangeHook(Object.assign({}, defaultObj, { isValid: this.state.isValid }));
      });
    }
  }

  // updateValidationStatus(tag, validStatus) {
  //   const validationStatus = _.cloneDeep(this.state.validationStatus);
  //   validationStatus[tag] = validStatus;
  //   const isValid = _.every(_.values(validationStatus), validationState => (validationState === 'success'));
  //   this.setState({ validationStatus, isValid });
  // }

  isValidInput(val) {
    return val.length > 0;
  }

  isValidOutput(val) {
    return /^[a-z0-9_]+$/i.test(val);
  }

  isValidLabel(val) {
    return /^[a-z0-9_ ]+$/i.test(val);
  }

  isValidService(val) {
    const urlRegexp = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=/]*$/i;
    return urlRegexp.test(val);
  }

  isValidOptions(val) {
    if (val === '') {
      return true;
    }
    try {
      JSON.parse(val);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Determine if all input options are valid
   */
  isValidOperation(panelDataObj, callbackFn = () => {}) {
    const { input, output, label, service, options } = panelDataObj; // eslint-disable-line object-curly-newline
    const isValid = (
      this.isValidInput(input) && this.isValidOutput(output) &&
      this.isValidLabel(label) && this.isValidService(service) &&
      this.isValidOptions(options));
    // console.log('isValidOperation - ', isValid);
    this.setState({ isValid }, callbackFn);
  }

  /**
   * Return if the specific form element is valid. If val is supplied, then uses
   * its value for validation. If not supplied, looks up corresponding prop and
   * returns associated validation flag
   */
  validateFormElement(field, val) {
    let isValid = false;
    switch (field.toLowerCase()) {
      case 'input':
        isValid = this.isValidInput(val);
        break;
      case 'output':
        isValid = this.isValidOutput(val);
        break;
      case 'label':
        isValid = this.isValidLabel(val);
        break;
      case 'service':
        isValid = this.isValidService(val);
        break;
      case 'options':
        isValid = this.isValidOptions(val);
        break;
      default:
        break;
    }
    return isValid ? 'success' : 'error';
  }

  onChangeFactory(tag) {
    // Returns an onChange handler for supplied tag which when fired, returns
    // an up to data object of form { input, output, label, service, options, isValid }
    return (event) => {
      const defaultObj = _.cloneDeep(this.props.panelObj.data);
      if (tag === 'input') {
        // This is a callback from MultiSelect input selector component
        defaultObj.input = event;
      } else {
        defaultObj[tag] = event.target.value;
      }
      // Set isValid state first, then call onChangeHook with updated panel and isValid state
      this.isValidOperation(defaultObj, () => {
        defaultObj.isValid = this.state.isValid;
        // console.log('in onChangeFactory:', defaultObj, this.state.isValid);
        this.props.onChangeHook(defaultObj);
      });
    };
  }

  render() {
    const { input: inp, output, label, service, options } = this.props.panelObj.data;
    const isInputArray = Array.isArray(inp);
    const input = isInputArray ? inp : [inp];
    return (
      <div>
        <Form horizontal>
          <LabeledFormGroup
            formLabel="Input"
            value={JSON.stringify(input)}
            validateForm={val => this.validateFormElement('input', val)}
            classNames={classNames}
          >
            <Multiselect
              data={this.props.inputLabelList}
              value={input}
              filter="contains"
              onChange={this.onChangeFactory('input')}
              containerClassName={input.length > 0 ? 'valid' : 'invalid'}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel="Output"
            value={output}
            validateForm={val => this.validateFormElement('output', val)}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={output}
              onChange={this.onChangeFactory('output')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel="Operation Label"
            value={label}
            validateForm={val => this.validateFormElement('label', val)}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={label}
              onChange={this.onChangeFactory('label')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel="Service URL"
            value={service}
            validateForm={val => this.validateFormElement('service', val)}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={service}
              onChange={this.onChangeFactory('service')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel="Options"
            value={options}
            validateForm={val => this.validateFormElement('options', val)}
            classNames={classNames}
          >
            <FormControl
              componentClass="textarea"
              value={options}
              onChange={this.onChangeFactory('options')}
            />
          </LabeledFormGroup>
        </Form>
      </div>
    );
  }
}

FlowbokopOperationBuilder.propTypes = propTypes;
FlowbokopOperationBuilder.defaultProps = defaultProps;

export default FlowbokopOperationBuilder;
