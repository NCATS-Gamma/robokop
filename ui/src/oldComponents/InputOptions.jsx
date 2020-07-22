import React from 'react';

import Combobox from 'react-widgets/lib/Combobox';

class InputOptions extends React.Component {
  constructor(props) {
    super(props);

    this.handleSelect = this.handleSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSelect(value, metaData) {
    this.props.onSelect(value, metaData);
  }
  handleChange(value) {
    this.props.onChange(value);
  }
  render() {
    return (
      <div>
        <Combobox
          autoFocus
          data={this.props.options}
          value={this.props.defaultValue}
          placeholder={this.props.placeholder}
          onSelect={this.handleSelect}
          onChange={this.handleChange}
          readOnly={this.props.disable}
        />
      </div>
    );
  }
}

InputOptions.defaultProp = {
  placeHolder: 'Enter Text',
  options: [],
  defaultValue: null,
  onChange: (value) => {},
  onSelect: (value, metaData) => {},
  disable: false,
};

export default InputOptions;
