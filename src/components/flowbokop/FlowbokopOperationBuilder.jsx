import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormControl, Tooltip, OverlayTrigger } from 'react-bootstrap';
import FaInfoCircle from 'react-icons/lib/fa/info-circle';
import Multiselect from 'react-widgets/lib/Multiselect';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';

import LabeledFormGroup from './../shared/LabeledFormGroup';


const propTypes = {
  activePanel: PropTypes.shape({
    inputType: PropTypes.string.isRequired,
    data: PropTypes.shape({
      input: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
      output: PropTypes.string.isRequired,
      service: PropTypes.string.isRequired,
      options: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  inputLabelList: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const classNames = {
  formLabel: 'col-md-2 form-label',
  formControl: 'col-md-10',
};

const inputTooltip = (
  <Tooltip placement="top" className="in" id="tooltip-top-1">
    Select one or more inputs for this operation
  </Tooltip>
);

const outputTooltip = (
  <Tooltip placement="top" className="in" id="tooltip-top-2">
    A unique variable name for the output of this operation (A-Z, 0-9 and _ allowed)
  </Tooltip>
);

const operationLabelTooltip = (
  <Tooltip placement="top" className="in" id="tooltip-top-3">
    Label for this operation
  </Tooltip>
);

const serviceTooltip = (
  <Tooltip placement="top" className="in" id="tooltip-top-4">
    Valid URL to Flowbokop service endpoint for desired operation
  </Tooltip>
);

const optionsTooltip = (
  <Tooltip placement="top" className="in" id="tooltip-top-5">
    A valid JSON string of options for this Flowbokop service
  </Tooltip>
);

// @inject(({ store }) => ({ store }))
@observer
class FlowbokopOperationBuilder extends React.Component {
  constructor(props) {
    super(props);
    this.validateFormElement = this.validateFormElement.bind(this);
  }

  /**
   * Return if the specific form element is valid. If val is supplied, then uses
   * its value for validation. If not supplied, looks up corresponding prop and
   * returns associated validation flag
   */
  validateFormElement(field) {
    let isValid = false;
    switch (field.toLowerCase()) {
      case 'input':
        isValid = this.props.activePanel.isValidInput;
        break;
      case 'output':
        isValid = this.props.activePanel.isValidOutput;
        break;
      case 'label':
        isValid = this.props.activePanel.isValidLabel;
        break;
      case 'service':
        isValid = this.props.activePanel.isValidService;
        break;
      case 'options':
        isValid = this.props.activePanel.isValidOptions;
        break;
      default:
        break;
    }
    return isValid ? 'success' : 'error';
  }

  onChangeFactory(tag) {
    // Returns an onChange handler for supplied tag which when fired, provides
    // an up to data object of form { input, output, label, service, options, isValid }
    // to the supplied onChangeHook method in props
    return (event) => {
      if (tag === 'input') {
        // This is a callback from MultiSelect input selector component
        this.props.activePanel.updateField(tag, event);
      } else {
        this.props.activePanel.updateField(tag, event.target.value);
      }
    };
  }

  render() {
    const {
      input: inp, output, label, service, options,
    } = this.props.activePanel.data;

    const isInputArray = Array.isArray(toJS(inp));
    const input = isInputArray ? toJS(inp) : [toJS(inp)];
    return (
      <div>
        <Form horizontal>
          <LabeledFormGroup
            formLabel={
              <span>{'Input  '}
                <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={inputTooltip}>
                  <FaInfoCircle size={10} />
                </OverlayTrigger>
              </span>
            }
            value={JSON.stringify(input)}
            validateForm={() => this.validateFormElement('input')}
            classNames={classNames}
          >
            <Multiselect
              data={toJS(this.props.inputLabelList)}
              value={input}
              filter="contains"
              onChange={this.onChangeFactory('input')}
              containerClassName={input.length > 0 ? 'valid' : 'invalid'}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel={
              <span>{'Output  '}
                <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={outputTooltip}>
                  <FaInfoCircle size={10} />
                </OverlayTrigger>
              </span>
            }
            value={output}
            validateForm={() => this.validateFormElement('output')}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={output}
              onChange={this.onChangeFactory('output')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel={
              <span>{'Operation Label  '}
                <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={operationLabelTooltip}>
                  <FaInfoCircle size={10} />
                </OverlayTrigger>
              </span>
            }
            value={label}
            validateForm={() => this.validateFormElement('label')}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={label}
              onChange={this.onChangeFactory('label')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel={
              <span>{'Service URL  '}
                <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={serviceTooltip}>
                  <FaInfoCircle size={10} />
                </OverlayTrigger>
              </span>
            }
            value={service}
            validateForm={() => this.validateFormElement('service')}
            classNames={classNames}
          >
            <FormControl
              type="text"
              value={service}
              onChange={this.onChangeFactory('service')}
            />
          </LabeledFormGroup>
          <LabeledFormGroup
            formLabel={
              <span>{'Options  '}
                <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={optionsTooltip}>
                  <FaInfoCircle size={10} />
                </OverlayTrigger>
              </span>
            }
            value={options}
            validateForm={() => this.validateFormElement('options')}
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
// FlowbokopOperationBuilder.defaultProps = defaultProps;

export default FlowbokopOperationBuilder;
