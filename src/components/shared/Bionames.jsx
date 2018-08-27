import React from 'react';

class Bionames extends React.Component {
  constructor(props) {
    super(props);

    this.onSearch = this.onSearch.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSearch(input, nodeType) {
    if (!input || (input.length < 3)) {
      return Promise.resolve({ options: [] });
    }
    return this.props.search(input, nodeType);
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
        Search stuff.
      </div>
    );
  }
}

Bionames.defaultProp = {
  search: () => { options: [] },
  concepts: [],
};

export default Bionames;
