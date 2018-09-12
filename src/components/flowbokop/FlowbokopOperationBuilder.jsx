import React from 'react';
import PropTypes from 'prop-types';

import { Form, FormControl } from 'react-bootstrap';
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
  onChangeHook: PropTypes.func, // Form of ({input, output, service, options}) => {}
};

const defaultProps = {
  onChangeHook: () => {},
};

const classNames = {
  formLabel: 'col-md-2 form-label',
  formControl: 'col-md-10',
};

class FlowbokopOperationBuilder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      validationStatus: {
        input: '',
        output: '',
        label: '',
        service: '',
        options: '',
      },
      isValid: false,
    };
  }

  updateValidationStatus(tag, validStatus) {
    const validationStatus = _.cloneDeep(this.state.validationStatus);
    validationStatus[tag] = validStatus;
    const isValid = _.every(_.values(validationStatus), validationState => (validationState === 'success'));
    this.setState({ validationStatus, isValid });
  }

  onChangeFactory(tag) {
    // Returns an onChange handler for supplied tag which when fired, returns
    // an up to data object of form { input, output, label, service, options }
    return (event) => {
      const defaultObj = _.cloneDeep(this.props.panelObj.data);
      defaultObj[tag] = event.target.value;
      // defaultObj.input = JSON.parse(defaultObj.input);
      this.props.onChangeHook(defaultObj);
    };
  }

  render() {
    const { input, output, label, service, options } = this.props.panelObj.data;
    const isInputArray = Array.isArray(input);
    return (
      <div>
        <Form horizontal>
          <LabeledFormGroup
            formLabel="Input"
            value={isInputArray ? JSON.stringify(input) : input}
            validationHookFn={validationState => this.updateValidationStatus('input', validationState)}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={isInputArray ? JSON.stringify(input) : input}
              // placeholder={''}
              onChange={this.onChangeFactory('input')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel="Output"
            value={output}
            validationHookFn={validationState => this.updateValidationStatus('output', validationState)}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={output}
              // placeholder={''}
              onChange={this.onChangeFactory('output')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel="Operation Label"
            value={label}
            validationHookFn={validationState => this.updateValidationStatus('label', validationState)}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={label}
              // placeholder={''}
              onChange={this.onChangeFactory('label')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel="Service URL"
            value={service}
            validationHookFn={validationState => this.updateValidationStatus('service', validationState)}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={service}
              // placeholder={''}
              onChange={this.onChangeFactory('service')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel="Options"
            value={options}
            validateForm={() => 'success'}
            validationHookFn={validationState => this.updateValidationStatus('options', validationState)}
            classNames={classNames}
          >
            <FormControl
              type="textarea"
              value={options}
              // placeholder={''}
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
