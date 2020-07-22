import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup } from 'react-bootstrap';


const propTypes = {
  styles: PropTypes.shape({ formLabel: PropTypes.object, formControl: PropTypes.object }),
  classNames: PropTypes.shape({ formLabel: PropTypes.string, formControl: PropTypes.string }),
  formLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  validateForm: PropTypes.func,
  validationHookFn: PropTypes.func, // This provides validation string as input arg when values change in field
  children: PropTypes.element.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const defaultProps = {
  validateForm: value => (value.toString().length > 0 ? 'success' : 'error'),
  validationHookFn: (validationStatus) => {}, // eslint-disable-line
  styles: {},
  classNames: {},
  value: '',
};

class LabeledFormGroup extends React.Component {
  constructor(props) {
    super(props);

    this.styles = {
      formLabel: {
        textAlign: 'right',
        marginTop: '8px',
      },
      formControl: {},
      container: { display: 'inline' },
    };

    this.classNames = {
      formLabel: 'col-md-3 form-label',
      formControl: 'col-md-9',
    };
  }

  componentWillMount() {
    const validationState = this.props.validateForm(this.props.value);
    this.props.validationHookFn(validationState); // Call the supplied hook with validationState string
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      const validationState = nextProps.validateForm(nextProps.value);
      nextProps.validationHookFn(validationState); // Call the supplied hook with validationState string
    }
  }

  render() {
    const { styles, classNames } = this.props;
    const mergedClassNames = { ...this.classNames, ...classNames };
    const mergedFormLabelStyles = { ...this.styles.formLabel, ...styles.formLabel };
    const mergedFormControlStyles = { ...this.styles.formControl, ...styles.formControl };
    const mergedContainerStyles = { ...this.styles.container, ...styles.container };

    return (
      <div className="FormGroup-container" style={mergedContainerStyles}>
        <FormGroup validationState={this.props.validateForm(this.props.value)}>
          <div className={`${mergedClassNames.formLabel}`} style={mergedFormLabelStyles}>
            {this.props.formLabel}
          </div>
          <div className={`${mergedClassNames.formControl}`} style={mergedFormControlStyles}>
            {this.props.children}
          </div>
        </FormGroup>
      </div>
    );
  }
}

LabeledFormGroup.defaultProps = defaultProps;
LabeledFormGroup.propTypes = propTypes;

export default LabeledFormGroup;
